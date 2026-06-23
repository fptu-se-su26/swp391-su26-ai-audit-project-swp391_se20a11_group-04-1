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
        # Use workspace or standard /tmp folder depending on OS
        # We can use a temp folder inside the workspace or standard temp path
        # In a Docker container (Linux), /tmp is perfectly fine and isolated.
        # If running on Windows local environment without Docker, we can use a local temp dir.
        # Let's write to a path inside workspace's temp if we want, or os.path.join(tempfile.gettempdir())
        import tempfile
        temp_dir = tempfile.gettempdir()
        clone_dir = os.path.join(temp_dir, f"devtrack_repo_sync_{project_id}")
        
        if os.path.exists(clone_dir):
            try:
                shutil.rmtree(clone_dir, ignore_errors=True)
            except Exception as e:
                print(f"Warning: failed to clear directory {clone_dir}: {e}")
            
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
            reporter.report(0, "ERROR", f"Không thể clone repository: {str(e)}", error_message=str(e))
            raise e

    @staticmethod
    def cleanup(clone_dir: str):
        if clone_dir and os.path.exists(clone_dir):
            try:
                shutil.rmtree(clone_dir, ignore_errors=True)
            except Exception as e:
                print(f"Warning: failed to delete directory {clone_dir}: {e}")
