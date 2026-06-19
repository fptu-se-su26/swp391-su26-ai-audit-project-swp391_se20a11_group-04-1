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

        nodes = []
        edges = []

        file_id = f"file:{relative_path}"
        file_node = {
            "nodeId": file_id,
            "name": relative_path.split("/")[-1],
            "type": "FILE",
            "layer": "OVERVIEW",
            "parentId": None,
            "filePath": relative_path,
            "language": ext,
            "lineStart": 1,
            "lineEnd": max(1, len(code_content.splitlines())),
            "metadata": {
                "sizeBytes": len(code_content),
                "imports": []
            },
            "childrenIds": []
        }
        nodes.append(file_node)

        def get_node_text(node):
            return code_content[node.start_byte:node.end_byte]

        # Extract imports
        imports = []
        def find_imports(node):
            if node.type in ('import_statement', 'import_alias_mapper'):
                imp_text = get_node_text(node).strip()
                imports.append(imp_text)
            for child in node.children:
                find_imports(child)
        find_imports(tree.root_node)
        file_node["metadata"]["imports"] = imports

        def traverse(node):
            if node.type in ('class_declaration', 'class'):
                class_name = ""
                for child in node.children:
                    if child.type in ('type_identifier', 'identifier'):
                        class_name = get_node_text(child)
                        break
                if class_name:
                    class_id = f"cls:{relative_path}:{class_name}"
                    class_node = {
                        "nodeId": class_id,
                        "name": class_name,
                        "type": "CLASS",
                        "layer": "MODULE",
                        "parentId": file_id,
                        "filePath": relative_path,
                        "language": ext,
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "methodCount": 0
                        },
                        "childrenIds": []
                    }
                    nodes.append(class_node)
                    file_node["childrenIds"].append(class_id)
                    
                    edges.append({
                        "edgeId": f"edge:{file_id}-contains-{class_id}",
                        "source": file_id,
                        "target": class_id,
                        "type": "CONTAINS",
                        "layer": "OVERVIEW",
                        "confidence": "EXTRACTED"
                    })
                    
                    for child in node.children:
                        if child.type == 'class_body':
                            for body_child in child.children:
                                if body_child.type in ('method_definition', 'public_method_definition'):
                                    method_name = ""
                                    for c in body_child.children:
                                        if c.type == 'property_identifier':
                                            method_name = get_node_text(c)
                                            break
                                    if method_name:
                                        method_id = f"fn:{class_id}:{method_name}"
                                        method_node = {
                                            "nodeId": method_id,
                                            "name": method_name,
                                            "type": "METHOD",
                                            "layer": "FLOW",
                                            "parentId": class_id,
                                            "filePath": relative_path,
                                            "language": ext,
                                            "lineStart": body_child.start_point[0] + 1,
                                            "lineEnd": body_child.end_point[0] + 1,
                                            "metadata": {
                                                "calls": []
                                            },
                                            "childrenIds": []
                                        }
                                        
                                        calls = []
                                        def find_calls(n):
                                            if n.type == 'call_expression':
                                                for c in n.children:
                                                    if c.type == 'identifier':
                                                        calls.append((get_node_text(c), None))
                                                    elif c.type == 'member_expression':
                                                        called_on = None
                                                        called_name = ""
                                                        for sub in c.children:
                                                            if sub.type == 'property_identifier':
                                                                called_name = get_node_text(sub)
                                                            elif sub.type == 'identifier':
                                                                called_on = get_node_text(sub)
                                                        if called_name:
                                                            calls.append((called_name, called_on))
                                            for c in n.children:
                                                find_calls(c)
                                        find_calls(body_child)
                                        method_node["metadata"]["calls"] = calls
                                        nodes.append(method_node)
                                        class_node["childrenIds"].append(method_id)
                                        class_node["metadata"]["methodCount"] += 1
                                        
                                        edges.append({
                                            "edgeId": f"edge:{class_id}-contains-{method_id}",
                                            "source": class_id,
                                            "target": method_id,
                                            "type": "CONTAINS",
                                            "layer": "MODULE",
                                            "confidence": "EXTRACTED"
                                        })
                    return

            elif node.type in ('function_declaration', 'lexical_declaration', 'variable_declaration'):
                func_name = ""
                is_arrow_func = False
                
                if node.type == 'function_declaration':
                    for child in node.children:
                        if child.type == 'identifier':
                            func_name = get_node_text(child)
                            break
                else:
                    for child in node.children:
                        if child.type == 'variable_declarator':
                            for sub in child.children:
                                if sub.type == 'identifier':
                                    func_name = get_node_text(sub)
                                elif sub.type == 'arrow_function':
                                    is_arrow_func = True
                
                if func_name:
                    type_str = "FUNCTION"
                    if func_name[0].isupper() and (is_arrow_func or node.type == 'function_declaration'):
                        type_str = "COMPONENT"
                    elif func_name.startswith("use") and len(func_name) > 3 and func_name[3].isupper():
                        type_str = "HOOK"
                        
                    func_id = f"fn:{relative_path}:{func_name}"
                    func_node = {
                        "nodeId": func_id,
                        "name": func_name,
                        "type": type_str,
                        "layer": "FLOW" if type_str == "FUNCTION" else "MODULE",
                        "parentId": file_id,
                        "filePath": relative_path,
                        "language": ext,
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "calls": []
                        },
                        "childrenIds": []
                    }
                    
                    calls = []
                    def find_calls(n):
                        if n.type == 'call_expression':
                            for c in n.children:
                                if c.type == 'identifier':
                                    calls.append((get_node_text(c), None))
                                elif c.type == 'member_expression':
                                    called_on = None
                                    called_name = ""
                                    for sub in c.children:
                                        if sub.type == 'property_identifier':
                                            called_name = get_node_text(sub)
                                        elif sub.type == 'identifier':
                                            called_on = get_node_text(sub)
                                    if called_name:
                                        calls.append((called_name, called_on))
                        for c in n.children:
                            find_calls(c)
                    
                    find_calls(node)
                    func_node["metadata"]["calls"] = calls
                    
                    nodes.append(func_node)
                    file_node["childrenIds"].append(func_id)
                    
                    edges.append({
                        "edgeId": f"edge:{file_id}-contains-{func_id}",
                        "source": file_id,
                        "target": func_id,
                        "type": "CONTAINS",
                        "layer": "OVERVIEW",
                        "confidence": "EXTRACTED"
                    })
                    return

            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        return nodes, edges
