from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import uvicorn
import os
import traceback
from typing import Optional

from services.progress_reporter import ProgressReporter, DummyReporter
from services.clone_service import CloneService
from services.parser_service import ParserService
from services.graph_builder import GraphBuilder
from services.selector_scan_service import SelectorScanService

app = FastAPI(title="DevTrack Architecture Parser Microservice")

class ParseRequest(BaseModel):
    repoUrl: str
    token: str = None
    branch: str = None
    projectId: int
    geminiApiKey: str = None
    geminiApiUrl: str = None


class ExtractSelectorsRequest(BaseModel):
    repoUrl: str
    token: Optional[str] = None
    branch: str = "main"

@app.post("/parse")
async def parse_repository(request: ParseRequest):
    reporter = ProgressReporter(request.projectId)
    clone_dir = None
    try:
        clone_dir = CloneService.clone(
            repo_url=request.repoUrl,
            token=request.token,
            branch=request.branch,
            project_id=request.projectId,
            reporter=reporter
        )
        
        raw_nodes, raw_edges, stats = ParserService.parse_repo(clone_dir, reporter)
        
        reporter.report(85, "SYNCING", "Đang phân tích liên kết đồ thị và tối ưu hóa...")
        nodes, edges, final_stats = GraphBuilder.build_graph(
            raw_nodes, raw_edges, stats, clone_dir, 
            request.geminiApiKey, request.geminiApiUrl
        )
        
        reporter.report(95, "SYNCING", "Đang dọn dẹp các tệp tạm thời...")
        CloneService.cleanup(clone_dir)
        
        reporter.report(100, "READY", "Phân tích kiến trúc mã nguồn hoàn tất!")
        
        return {
            "nodes": nodes,
            "edges": edges,
            "stats": final_stats
        }
        
    except Exception as e:
        traceback.print_exc()
        if clone_dir:
            CloneService.cleanup(clone_dir)
        reporter.report(0, "ERROR", f"Lỗi phân tích: {str(e)}", error_message=str(e))
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/health")
def health_check():
    return {"status": "UP"}


@app.post("/extract-selectors")
async def extract_selectors(request: ExtractSelectorsRequest):
    """
    Clone a GitHub repository, scan frontend source files (.jsx, .tsx, .vue, .html),
    extract interactive element attributes (data-testid, id, name, aria-label, placeholder),
    and return a structured selector map grouped by file path.

    Used by the backend AI Test Case Generator to enrich Gemini prompts with real selectors.
    """
    clone_dir = None
    try:
        reporter = DummyReporter()
        clone_dir = CloneService.clone(
            repo_url=request.repoUrl,
            token=request.token,
            branch=request.branch,
            project_id=0,       # dummy — DummyReporter ignores project_id
            reporter=reporter
        )

        selector_map = SelectorScanService.scan(clone_dir)
        stats = SelectorScanService.compute_stats(selector_map)

        return {
            "selectorMap": selector_map,
            **stats
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if clone_dir:
            CloneService.cleanup(clone_dir)

if __name__ == "__main__":
    port = int(os.getenv("PORT", 4002))
    uvicorn.run("main:app", host="0.0.0.0", port=port, reload=True)
