import os

class GraphBuilder:
    @staticmethod
    def build_graph(raw_nodes: list, raw_edges: list, stats: dict) -> tuple[list, list, dict]:
        nodes = []
        edges = []
        
        node_map = {}
        class_name_to_node_id = {}
        method_name_to_node_ids = {}
        
        file_nodes = []
        module_nodes = []
        flow_nodes = []
        
        for node in raw_nodes:
            nid = node["nodeId"]
            node_map[nid] = node
            
            if node["type"] == "FILE":
                file_nodes.append(node)
            elif node["type"] in ("CLASS", "INTERFACE", "COMPONENT", "HOOK"):
                module_nodes.append(node)
                class_name_to_node_id[node["name"]] = nid
            elif node["type"] in ("METHOD", "FUNCTION"):
                flow_nodes.append(node)
                method_name_to_node_ids.setdefault(node["name"], []).append(nid)

        # Build Folder / Package Hierarchy for Layer 1
        folder_nodes = {}
        
        for file_node in file_nodes:
            file_path = file_node["filePath"]
            dir_path = os.path.dirname(file_path).replace("\\", "/")
            
            if not dir_path:
                file_node["parentId"] = None
                nodes.append(file_node)
                continue
                
            parts = dir_path.split("/")
            current_path = ""
            parent_folder_id = None
            
            for i, part in enumerate(parts):
                current_path = "/".join(parts[:i+1])
                folder_id = f"pkg:{current_path}"
                
                if folder_id not in folder_nodes:
                    folder_node = {
                        "nodeId": folder_id,
                        "name": part,
                        "type": "PACKAGE",
                        "layer": "OVERVIEW",
                        "parentId": parent_folder_id,
                        "filePath": current_path + "/",
                        "language": "folder",
                        "lineStart": None,
                        "lineEnd": None,
                        "metadata": {
                            "fileCount": 0
                        },
                        "riskLevel": "LOW",
                        "connectionCount": 0,
                        "childrenIds": []
                    }
                    folder_nodes[folder_id] = folder_node
                    
                    if parent_folder_id:
                        edges.append({
                            "edgeId": f"edge:{parent_folder_id}-contains-{folder_id}",
                            "source": parent_folder_id,
                            "target": folder_id,
                            "type": "CONTAINS",
                            "layer": "OVERVIEW",
                            "confidence": "EXTRACTED"
                        })
                        folder_nodes[parent_folder_id]["childrenIds"].append(folder_id)
                
                parent_folder_id = folder_id
            
            file_node["parentId"] = parent_folder_id
            if parent_folder_id:
                folder_nodes[parent_folder_id]["metadata"]["fileCount"] += 1
                folder_nodes[parent_folder_id]["childrenIds"].append(file_node["nodeId"])
                
                edges.append({
                    "edgeId": f"edge:{parent_folder_id}-contains-{file_node['nodeId']}",
                    "source": parent_folder_id,
                    "target": file_node["nodeId"],
                    "type": "CONTAINS",
                    "layer": "OVERVIEW",
                    "confidence": "EXTRACTED"
                })
            
            nodes.append(file_node)

        nodes.extend(folder_nodes.values())
        nodes.extend(module_nodes)
        nodes.extend(flow_nodes)

        # Resolve Reference Edges (EXTENDS, IMPLEMENTS)
        resolved_edges = []
        for edge in raw_edges:
            target = edge["target"]
            if target.startswith("cls_ref:"):
                ref_name = target.replace("cls_ref:", "")
                if ref_name in class_name_to_node_id:
                    edge["target"] = class_name_to_node_id[ref_name]
                    edge["confidence"] = "EXTRACTED"
                    resolved_edges.append(edge)
            else:
                resolved_edges.append(edge)

        # Resolve method calls and infer class dependencies
        for flow_node in flow_nodes:
            caller_id = flow_node["nodeId"]
            caller_class_id = flow_node["parentId"]
            calls = flow_node["metadata"].get("calls", [])
            
            for called_name, called_on in calls:
                potential_targets = method_name_to_node_ids.get(called_name, [])
                target_method_id = None
                
                if called_on:
                    called_on_clean = called_on.split(".")[-1]
                    for target_mid in potential_targets:
                        parts = target_mid.split(":")
                        if len(parts) >= 4:
                            target_class_name = parts[-2]
                            if (target_class_name.lower() == called_on_clean.lower() or 
                                called_on_clean.lower() in target_class_name.lower()):
                                target_method_id = target_mid
                                break
                
                if not target_method_id and potential_targets:
                    same_class_targets = [t for t in potential_targets if t.split(":")[:-1] == caller_id.split(":")[:-1]]
                    if same_class_targets:
                        target_method_id = same_class_targets[0]
                    else:
                        target_method_id = potential_targets[0]

                if target_method_id:
                    call_edge_id = f"edge:{caller_id}-calls-{target_method_id}"
                    resolved_edges.append({
                        "edgeId": call_edge_id,
                        "source": caller_id,
                        "target": target_method_id,
                        "type": "CALLS",
                        "layer": "FLOW",
                        "confidence": "EXTRACTED"
                    })
                    
                    if target_method_id in node_map:
                        target_class_id = node_map[target_method_id]["parentId"]
                        if caller_class_id and target_class_id and caller_class_id != target_class_id:
                            dep_edge_id = f"edge:{caller_class_id}-depends-{target_class_id}"
                            if not any(e["edgeId"] == dep_edge_id for e in resolved_edges):
                                resolved_edges.append({
                                    "edgeId": dep_edge_id,
                                    "source": caller_class_id,
                                    "target": target_class_id,
                                    "type": "DEPENDS_ON",
                                    "layer": "MODULE",
                                    "confidence": "INFERRED",
                                    "metadata": {
                                        "label": "calls method"
                                    }
                                })

        # Compute Metrics
        connection_counts = {node["nodeId"]: 0 for node in nodes}
        for edge in resolved_edges:
            src = edge["source"]
            tgt = edge["target"]
            if src in connection_counts:
                connection_counts[src] += 1
            if tgt in connection_counts:
                connection_counts[tgt] += 1

        god_nodes = []
        for node in nodes:
            nid = node["nodeId"]
            conn_count = connection_counts.get(nid, 0)
            node["connectionCount"] = conn_count
            
            if node["type"] in ("CLASS", "INTERFACE", "COMPONENT", "PACKAGE"):
                if conn_count >= 15:
                    node["riskLevel"] = "CRITICAL"
                elif conn_count >= 10:
                    node["riskLevel"] = "HIGH"
                elif conn_count >= 5:
                    node["riskLevel"] = "MEDIUM"
                else:
                    node["riskLevel"] = "LOW"
            else:
                if conn_count >= 10:
                    node["riskLevel"] = "HIGH"
                elif conn_count >= 5:
                    node["riskLevel"] = "MEDIUM"
                else:
                    node["riskLevel"] = "LOW"
            
            if node["type"] in ("CLASS", "PACKAGE") and conn_count >= 12:
                god_nodes.append({
                    "nodeId": nid,
                    "name": node["name"],
                    "type": node["type"],
                    "connections": conn_count
                })

        stats["totalNodes"] = len(nodes)
        stats["totalEdges"] = len(resolved_edges)
        stats["godNodes"] = sorted(god_nodes, key=lambda x: x["connections"], reverse=True)[:10]

        return nodes, resolved_edges, stats
