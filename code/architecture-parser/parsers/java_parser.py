from tree_sitter_languages import get_parser

class JavaParser:
    @staticmethod
    def parse_file(file_path: str, relative_path: str, code_content: str):
        try:
            parser = get_parser("java")
            tree = parser.parse(bytes(code_content, "utf8"))
        except Exception as e:
            print(f"Tree-sitter Java failed: {e}")
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
            "language": "java",
            "lineStart": 1,
            "lineEnd": max(1, len(code_content.splitlines())),
            "metadata": {
                "sizeBytes": len(code_content),
                "imports": [],
                "annotations": []
            },
            "childrenIds": []
        }

        # Helper to get node text
        def get_node_text(node):
            return code_content[node.start_byte:node.end_byte]

        imports = []
        annotations = []

        def traverse(node):
            if node.type == 'import_declaration':
                import_text = get_node_text(node).replace("import", "").replace(";", "").strip()
                imports.append(import_text)
            elif node.type in ('class_declaration', 'interface_declaration'):
                for child in node.children:
                    if child.type == 'modifiers':
                        for c in child.children:
                            if c.type == 'annotation':
                                anno_text = get_node_text(c).split("(")[0].replace("@", "").strip()
                                annotations.append(anno_text)
            
            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        
        file_node["metadata"]["imports"] = list(set(imports))
        file_node["metadata"]["annotations"] = list(set(annotations))

        return [file_node], []

