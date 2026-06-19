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
            "language": "java",
            "lineStart": 1,
            "lineEnd": max(1, len(code_content.splitlines())),
            "metadata": {
                "sizeBytes": len(code_content),
                "imports": []
            },
            "childrenIds": []
        }
        nodes.append(file_node)

        # Helper to get node text
        def get_node_text(node):
            return code_content[node.start_byte:node.end_byte]

        # Extract imports
        imports = []
        def find_imports(node):
            if node.type == 'import_declaration':
                import_text = get_node_text(node).replace("import", "").replace(";", "").strip()
                imports.append(import_text)
            for child in node.children:
                find_imports(child)
        find_imports(tree.root_node)
        file_node["metadata"]["imports"] = imports

        current_class_node = None
        
        def traverse(node):
            nonlocal current_class_node
            
            if node.type in ('class_declaration', 'interface_declaration'):
                class_name = ""
                for child in node.children:
                    if child.type == 'identifier':
                        class_name = get_node_text(child)
                        break
                
                if class_name:
                    annotations = []
                    def extract_annotations(n):
                        annos = []
                        if n.type == 'modifiers':
                            for c in n.children:
                                if c.type == 'annotation':
                                    anno_text = get_node_text(c).split("(")[0].strip()
                                    annos.append(anno_text)
                        return annos

                    for child in node.children:
                        if child.type == 'modifiers':
                            annotations.extend(extract_annotations(child))
                    
                    class_type = "CLASS" if node.type == 'class_declaration' else "INTERFACE"
                    class_id = f"cls:{relative_path}:{class_name}"
                    
                    extends_class = None
                    implements_interfaces = []
                    for child in node.children:
                        if child.type == 'superclass':
                            for sub in child.children:
                                if sub.type.endswith('type'):
                                    extends_class = get_node_text(sub).strip()
                        elif child.type in ('super_interfaces', 'interfaces'):
                            for sub in child.children:
                                if sub.type == 'type_list':
                                    for interface_type in sub.children:
                                        if interface_type.type.endswith('type'):
                                            implements_interfaces.append(get_node_text(interface_type).strip())
                                elif sub.type.endswith('type'):
                                    implements_interfaces.append(get_node_text(sub).strip())

                    class_node = {
                        "nodeId": class_id,
                        "name": class_name,
                        "type": class_type,
                        "layer": "MODULE",
                        "parentId": file_id,
                        "filePath": relative_path,
                        "language": "java",
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "annotations": annotations,
                            "extends": extends_class,
                            "implements": implements_interfaces,
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
                    
                    if extends_class:
                        edges.append({
                            "edgeId": f"edge:{class_id}-extends-{extends_class}",
                            "source": class_id,
                            "target": f"cls_ref:{extends_class}",
                            "type": "EXTENDS",
                            "layer": "MODULE",
                            "confidence": "INFERRED"
                        })
                    for impl in implements_interfaces:
                        edges.append({
                            "edgeId": f"edge:{class_id}-implements-{impl}",
                            "source": class_id,
                            "target": f"cls_ref:{impl}",
                            "type": "IMPLEMENTS",
                            "layer": "MODULE",
                            "confidence": "INFERRED"
                        })

                    old_class = current_class_node
                    current_class_node = class_node
                    for child in node.children:
                        if child.type == 'class_body':
                            for body_child in child.children:
                                traverse(body_child)
                    current_class_node = old_class
                    return

            elif node.type == 'method_declaration' and current_class_node:
                method_name = ""
                for child in node.children:
                    if child.type == 'identifier':
                        method_name = get_node_text(child)
                        break
                
                if method_name:
                    return_type = "void"
                    for child in node.children:
                        if child.type.endswith('type'):
                            return_type = get_node_text(child)
                            break

                    params = []
                    for child in node.children:
                        if child.type == 'formal_parameters':
                            for p in child.children:
                                if p.type == 'formal_parameter':
                                    params.append(get_node_text(p).strip())
                    
                    method_annos = []
                    for child in node.children:
                        if child.type == 'modifiers':
                            for c in child.children:
                                if c.type == 'annotation':
                                    method_annos.append(get_node_text(c).split("(")[0].strip())

                    method_id = f"fn:{current_class_node['nodeId']}:{method_name}"
                    method_signature = f"{method_name}({', '.join(params)})"
                    
                    method_node = {
                        "nodeId": method_id,
                        "name": method_name,
                        "type": "METHOD",
                        "layer": "FLOW",
                        "parentId": current_class_node["nodeId"],
                        "filePath": relative_path,
                        "language": "java",
                        "lineStart": node.start_point[0] + 1,
                        "lineEnd": node.end_point[0] + 1,
                        "metadata": {
                            "signature": method_signature,
                            "returnType": return_type,
                            "parameters": params,
                            "annotations": method_annos,
                            "calls": []
                        },
                        "childrenIds": []
                    }
                    
                    # Parse method body to find method invocations
                    calls = []
                    def find_calls(n):
                        if n.type == 'method_invocation':
                            called_name = ""
                            called_on = None
                            for c in n.children:
                                if c.type == 'identifier':
                                    called_name = get_node_text(c)
                                elif c.type in ('identifier', 'field_access', 'method_invocation'):
                                    called_on = get_node_text(c)
                            if called_name:
                                calls.append((called_name, called_on))
                        for c in n.children:
                            find_calls(c)

                    for child in node.children:
                        if child.type == 'block':
                            find_calls(child)

                    method_node["metadata"]["calls"] = calls
                    nodes.append(method_node)
                    current_class_node["childrenIds"].append(method_id)
                    current_class_node["metadata"]["methodCount"] += 1

                    edges.append({
                        "edgeId": f"edge:{current_class_node['nodeId']}-contains-{method_id}",
                        "source": current_class_node["nodeId"],
                        "target": method_id,
                        "type": "CONTAINS",
                        "layer": "MODULE",
                        "confidence": "EXTRACTED"
                    })
                    return

            for child in node.children:
                traverse(child)

        traverse(tree.root_node)
        return nodes, edges
