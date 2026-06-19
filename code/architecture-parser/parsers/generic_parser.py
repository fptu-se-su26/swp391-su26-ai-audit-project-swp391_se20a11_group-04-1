import re

class GenericParser:
    @staticmethod
    def parse_file(file_path: str, relative_path: str, code_content: str):
        # Extract basic imports using regex
        imports = []
        import_patterns = [
            r'(?:import|from)\s+([a-zA-Z0-9_\-\./\s,{}*]+)',
            r'require\s*\(\s*[\'"]([a-zA-Z0-9_\-\./]+)[\'"]\s*\)'
        ]
        for pattern in import_patterns:
            matches = re.findall(pattern, code_content)
            for m in matches:
                # Clean up match
                cleaned = m.strip().split('\n')[0]
                imports.append(cleaned)
                
        ext = relative_path.split(".")[-1].lower() if "." in relative_path else "unknown"
        
        file_node = {
            "nodeId": f"file:{relative_path}",
            "name": relative_path.split("/")[-1],
            "type": "FILE",
            "layer": "OVERVIEW",
            "parentId": None,
            "filePath": relative_path,
            "language": ext,
            "lineStart": 1,
            "lineEnd": max(1, len(code_content.splitlines())),
            "metadata": {
                "imports": list(set(imports)),
                "sizeBytes": len(code_content)
            },
            "childrenIds": []
        }
        
        # Generics don't have deep methods, so return empty edges
        return [file_node], []
