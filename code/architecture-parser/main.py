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
from services.form_map_service import FormMapService

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

@app.post("/extract-api-knowledge")
async def extract_api_knowledge(request: ExtractSelectorsRequest):
    """
    Clone a GitHub repository, scan Java Spring Boot source files, and extract
    controller/DTO annotation metadata to build a structured API Knowledge Model.

    Returns a list of endpoint definitions — no Swagger, no OpenAPI, no running backend.
    Pure static annotation analysis.

    Used by ApiKnowledgeService (backend) to ground Gemini prompts with real
    endpoint paths, HTTP methods, request body field names, validation constraints,
    authentication requirements, and expected status codes.
    """
    clone_dir = None
    try:
        reporter = DummyReporter()
        clone_dir = CloneService.clone(
            repo_url=request.repoUrl,
            token=request.token,
            branch=request.branch,
            project_id=0,
            reporter=reporter
        )

        from services.java_api_knowledge_extractor import JavaApiKnowledgeExtractor
        endpoints = JavaApiKnowledgeExtractor.extract(clone_dir)

        return {
            "endpoints": endpoints,
            "totalEndpoints": len(endpoints),
        }

    except Exception as e:
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))

    finally:
        if clone_dir:
            CloneService.cleanup(clone_dir)


@app.post("/extract-form-map")
async def extract_form_map(request: ExtractSelectorsRequest):
    """
    Clone a GitHub repository, parse all frontend/template files, and return a
    STRUCTURED FORM MAP — each interactive element is represented as an object
    with tag, type, name, id, placeholder, aria-label, label text, and a
    pre-computed Playwright selector.

    This is more accurate than /extract-selectors because:
    - Elements are grouped by their parent <form> (context-aware)
    - The `selector` field is pre-computed with priority: data-testid > name > id > aria-label
    - Semantic `role` hints (username_field, password_field, submit_button) are included
    - Label text is resolved from matching <label for="..."> tags

    Used by the backend AI Test Case Generator as a replacement for /extract-selectors
    when accurate selector mapping is required.
    """
    clone_dir = None
    try:
        reporter = DummyReporter()
        clone_dir = CloneService.clone(
            repo_url=request.repoUrl,
            token=request.token,
            branch=request.branch,
            project_id=0,
            reporter=reporter
        )

        form_map = FormMapService.scan(clone_dir)
        stats = FormMapService.compute_stats(form_map)

        return {
            "formMap": form_map,
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
