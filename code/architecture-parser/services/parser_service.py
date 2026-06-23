import os

class ParserService:
    EXCLUDED_DIRS = {
        '.git', 'node_modules', 'venv', '.venv', 'target', 'build', 'dist', 
        '.idea', '.vscode', 'out', 'bin', 'obj', 'gradle', '.gradle', 'vendor'
    }
    
    EXCLUDED_EXTS = {
        'png', 'jpg', 'jpeg', 'gif', 'ico', 'pdf', 'zip', 'tar', 'gz', 'rar', 'exe', 'dll', 'so', 'dylib', 'jar', 'war', 'class',
        'mp4', 'mp3', 'wav', 'woff', 'woff2', 'ttf', 'eot',
        'log', 'lock', 'db', 'sqlite'
    }

    @staticmethod
    def should_parse(file_path: str) -> bool:
        parts = file_path.replace("\\", "/").split("/")
        for part in parts:
            if part in ParserService.EXCLUDED_DIRS:
                return False
                
        ext = file_path.split(".")[-1].lower() if "." in file_path else ""
        if ext in ParserService.EXCLUDED_EXTS:
            return False
            
        return True

    @staticmethod
    def parse_repo(clone_dir: str, reporter) -> tuple[list, list, dict]:
        raw_nodes = []
        raw_edges = []
        stats = {
            "totalFiles": 0,
            "languages": {}
        }
        
        files_to_parse = []
        for root, dirs, files in os.walk(clone_dir):
            dirs[:] = [d for d in dirs if d not in ParserService.EXCLUDED_DIRS]
            
            for file in files:
                full_path = os.path.join(root, file)
                rel_path = os.path.relpath(full_path, clone_dir).replace("\\", "/")
                
                if ParserService.should_parse(rel_path):
                    files_to_parse.append((full_path, rel_path))
        
        total_files = len(files_to_parse)
        stats["totalFiles"] = total_files
        print(f"Found {total_files} files to count.")
        
        if total_files == 0:
            return [], [], stats

        processed = 0
        for full_path, rel_path in files_to_parse:
            ext = rel_path.split(".")[-1].lower() if "." in rel_path else "unknown"
            stats["languages"][ext] = stats["languages"].get(ext, 0) + 1
            processed += 1
            
            if processed % max(1, total_files // 10) == 0 or processed == total_files:
                progress = int(20 + 60 * (processed / total_files))
                reporter.report(progress, "SYNCING", f"Đang quét tập tin ({processed}/{total_files})...")

        return raw_nodes, raw_edges, stats
