from tree_sitter_languages import get_parser

class PythonParser:
    @staticmethod
    def parse_file(file_path: str, relative_path: str, code_content: str):
        try:
            parser = get_parser("python")
            tree = parser.parse(bytes(code_content, "utf8"))
        except Exception as e:
            print(f"Tree-sitter Python failed: {e}")
            from parsers.generic_parser import GenericParser
            return GenericParser.parse_file(file_path, relative_path, code_content)

        file_id = f"file:{relative_path}"
        file_node = {
            "nodeId": file_id,
            "name": relative_path.split("/")[-1],
            "type": "FILE",
            "layer": "INTERNAL",
            "parentId": None,
            "filePath": relative_path,
            "language": "python",
            "lineStart": 1,
            "lineEnd": max(1, len(code_content.splitlines())),
            "metadata": {
                "sizeBytes": len(code_content),
                "imports": [],
                "annotations": []
            },
            "childrenIds": []
        }

        def get_node_text(node):
            return code_content[node.start_byte:node.end_byte]

        imports = []
        annotations = []

        def traverse(node):
            if node.type in ('import_statement', 'import_from_statement'):
                imports.append(get_node_text(node).strip())
            elif node.type == 'decorator':
                dec_text = get_node_text(node).split("(")[0].replace("@", "").strip()
                annotations.append(dec_text)
            
            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        
        file_node["metadata"]["imports"] = list(set(imports))
        file_node["metadata"]["annotations"] = list(set(annotations))

        return [file_node], []

