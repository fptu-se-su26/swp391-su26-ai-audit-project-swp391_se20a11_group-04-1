from tree_sitter_languages import get_parser

class TypeScriptParser:
    @staticmethod
    def parse_file(file_path: str, relative_path: str, code_content: str):
        ext = relative_path.split(".")[-1].lower()
        lang_name = "tsx" if ext in ("tsx", "jsx") else "typescript"
        try:
            parser = get_parser(lang_name)
            tree = parser.parse(bytes(code_content, "utf8"))
        except Exception as e:
            print(f"Tree-sitter TS/TSX failed: {e}")
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
            "language": ext,
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
            if node.type in ('import_statement', 'import_alias_mapper'):
                imp_text = get_node_text(node).strip()
                imports.append(imp_text)
            elif node.type in ('function_declaration', 'lexical_declaration', 'variable_declarator', 'class_declaration', 'class'):
                name = ""
                for child in node.children:
                    if child.type in ('identifier', 'type_identifier', 'property_identifier'):
                        name = get_node_text(child).strip()
                        break
                if name:
                    if name.startswith("use") and len(name) > 3 and name[3].isupper():
                        annotations.append("Hook")
                    elif name[0].isupper() and ext in ("tsx", "jsx", "ts", "js"):
                        annotations.append("Component")
            
            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        
        if ext in ("tsx", "jsx") and "Hook" not in annotations and "Component" not in annotations:
            annotations.append("Component")
            
        file_node["metadata"]["imports"] = list(set(imports))
        file_node["metadata"]["annotations"] = list(set(annotations))

        return [file_node], []

