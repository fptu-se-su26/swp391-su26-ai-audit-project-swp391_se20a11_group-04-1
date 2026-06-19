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
            "language": "python",
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
            if node.type in ('import_statement', 'import_from_statement'):
                imports.append(get_node_text(node).strip())
            for child in node.children:
                find_imports(child)
        find_imports(tree.root_node)
        file_node["metadata"]["imports"] = imports

        current_class_node = None

        def traverse(node):
            nonlocal current_class_node
            
            if node.type == 'class_definition':
                class_name = ""
                for child in node.children:
                    if child.type == 'identifier':
                        class_name = get_node_text(child)
                        break
                if class_name:
                    superclasses = []
                    for child in node.children:
                        if child.type == 'argument_list':
                            for sub in child.children:
                                if sub.type == 'identifier':
                                    superclasses.append(get_node_text(sub))
                    
                    class_id = f"cls:{relative_path}:{class_name}"
                    class_node = {
                        "nodeId": class_id,
                        "name": class_name,
                        "type": "CLASS",
                        "layer": "MODULE",
                        "parentId": file_id,
                        "filePath": relative_path,
                        "language": "python",
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "extends": superclasses[0] if superclasses else None,
                            "extends_list": superclasses,
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
                    
                    for super_cls in superclasses:
                        edges.append({
                            "edgeId": f"edge:{class_id}-extends-{super_cls}",
                            "source": class_id,
                            "target": f"cls_ref:{super_cls}",
                            "type": "EXTENDS",
                            "layer": "MODULE",
                            "confidence": "INFERRED"
                        })
                    
                    old_class = current_class_node
                    current_class_node = class_node
                    for child in node.children:
                        if child.type == 'block':
                            for body_child in child.children:
                                traverse(body_child)
                    current_class_node = old_class
                    return

            elif node.type == 'function_definition':
                func_name = ""
                for child in node.children:
                    if child.type == 'identifier':
                        func_name = get_node_text(child)
                        break
                
                if func_name:
                    decorators = []
                    for child in node.children:
                        if child.type == 'decorator':
                            decorators.append(get_node_text(child).strip())
                        elif child.type == 'decorator_list':
                            for dec in child.children:
                                if dec.type == 'decorator':
                                    decorators.append(get_node_text(dec).strip())

                    params = []
                    for child in node.children:
                        if child.type == 'parameters':
                            for p in child.children:
                                if p.type in ('identifier', 'dictionary_splat_pattern', 'list_splat_pattern', 'typed_parameter', 'default_parameter'):
                                    params.append(get_node_text(p).strip())

                    node_type = "METHOD" if current_class_node else "FUNCTION"
                    parent_id = current_class_node["nodeId"] if current_class_node else file_id
                    
                    func_id = f"fn:{parent_id}:{func_name}" if current_class_node else f"fn:{relative_path}:{func_name}"
                    
                    func_node = {
                        "nodeId": func_id,
                        "name": func_name,
                        "type": node_type,
                        "layer": "FLOW",
                        "parentId": parent_id,
                        "filePath": relative_path,
                        "language": "python",
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "parameters": params,
                            "decorators": decorators,
                            "calls": []
                        },
                        "childrenIds": []
                    }
                    
                    calls = []
                    def find_calls(n):
                        if n.type == 'call':
                            for c in n.children:
                                if c.type == 'identifier':
                                    calls.append((get_node_text(c), None))
                                elif c.type == 'attribute':
                                    txt = get_node_text(c).split(".")
                                    if len(txt) > 1:
                                        calls.append((txt[-1], ".".join(txt[:-1])))
                        for c in n.children:
                            find_calls(c)
                            
                    find_calls(node)
                    func_node["metadata"]["calls"] = calls
                    
                    nodes.append(func_node)
                    if current_class_node:
                        current_class_node["childrenIds"].append(func_id)
                        current_class_node["metadata"]["methodCount"] += 1
                        edges.append({
                            "edgeId": f"edge:{current_class_node['nodeId']}-contains-{func_id}",
                            "source": current_class_node["nodeId"],
                            "target": func_id,
                            "type": "CONTAINS",
                            "layer": "MODULE",
                            "confidence": "EXTRACTED"
                        })
                    else:
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
