import os
import shutil
import git
from urllib.parse import urlparse

class CloneService:
    @staticmethod
    def prepare_clone_url(repo_url: str, token: str = None) -> str:
        if not token:
            return repo_url
        
        parsed = urlparse(repo_url)
        netloc = parsed.netloc
        if "@" in netloc:
            netloc = netloc.split("@")[-1]
            
        path = parsed.path
        if not path.endswith(".git"):
            path = path + ".git"
            
        return f"https://{token}@{netloc}{path}"

    @staticmethod
    def clone(repo_url: str, token: str, branch: str, project_id: int, reporter) -> str:
        import tempfile
        import uuid
        temp_dir = tempfile.gettempdir()
        clone_dir = os.path.join(temp_dir, f"devtrack_repo_sync_{project_id}_{uuid.uuid4().hex}")
            
        reporter.report(5, "SYNCING", "Đang kết nối GitHub và clone repository...")
        
        clone_url = CloneService.prepare_clone_url(repo_url, token)
        
        kwargs = {"depth": 1}
        if branch:
            kwargs["branch"] = branch
            
        try:
            git.Repo.clone_from(clone_url, clone_dir, **kwargs)
            reporter.report(20, "SYNCING", "Clone repository thành công. Đang quét cấu trúc file...")
            return clone_dir
        except Exception as e:
            err_str = str(e)
            if branch and ("Remote branch" in err_str or "not found" in err_str or "exit code(128)" in err_str):
                print(f"Branch '{branch}' not found in remote. Retrying clone with default branch...")
                reporter.report(10, "SYNCING", f"Không thấy nhánh '{branch}', đang tự động thử lại với nhánh mặc định...")
                try:
                    if os.path.exists(clone_dir):
                        CloneService.cleanup(clone_dir)
                    git.Repo.clone_from(clone_url, clone_dir, depth=1)
                    reporter.report(20, "SYNCING", "Clone repository thành công. Đang quét cấu trúc file...")
                    return clone_dir
                except Exception as retry_e:
                    reporter.report(0, "ERROR", f"Không thể clone repository: {str(retry_e)}", error_message=str(retry_e))
                    raise retry_e
            reporter.report(0, "ERROR", f"Không thể clone repository: {err_str}", error_message=err_str)
            raise e

    @staticmethod
    def cleanup(clone_dir: str):
        if clone_dir and os.path.exists(clone_dir):
            import stat
            def on_rm_error(func, path, exc_info):
                os.chmod(path, stat.S_IWRITE)
                func(path)
            try:
                shutil.rmtree(clone_dir, onerror=on_rm_error)
            except Exception as e:
                print(f"Warning: failed to delete directory {clone_dir}: {e}")
