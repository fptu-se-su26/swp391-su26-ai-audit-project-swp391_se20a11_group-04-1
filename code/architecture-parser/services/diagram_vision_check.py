import os
import json
import httpx

class DiagramVisionChecker:
    def __init__(self, api_key: str = None, api_url: str = None):
        self.api_key = api_key or os.getenv("GEMINI_API_KEY", "")
        self.api_url = api_url or "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

    def check_and_fix(self, nodes, edges, stats):
        """
        Sends the JSON graph representation to Gemini to analyze the connection density 
        and output spacing/padding layout hints (extra_padding, extra_node_spacing, extra_edge_spacing)
        to prevent overlaps before rendering.
        """
        if not self.api_key:
            print("Gemini API Key not set. Skipping vision layout checker.")
            return {"extra_padding": 0, "extra_edge_spacing": 0, "extra_node_spacing": 0}

        try:
            # Minimal summary to fit tokens and run extremely fast
            graph_summary = {
                "nodes": [{"id": n["nodeId"], "type": n["type"], "parentId": n.get("parentId"), "name": n["name"]} for n in nodes],
                "edges": [{"source": e["source"], "target": e["target"], "label": e.get("metadata", {}).get("label", "")} for e in edges]
            }

            prompt = f"""You are an expert system architecture diagram designer. Analyze the following JSON graph structure:
{json.dumps(graph_summary, indent=2, ensure_ascii=False)}

Determine if the diagram is crowded, has many nested children in one group, or has a high density of connection lines.
Suggest spacing layout hints to ensure nodes do not overlap, text has breathing room, and parallel lines are spaced.

Return ONLY a raw JSON object with this schema:
{{
  "extra_padding": 0 to 32 (added padding for groups if any group contains > 4 child nodes),
  "extra_node_spacing": 0 to 60 (increased node spacing if total node count > 8),
  "extra_edge_spacing": 0 to 30 (increased spacing between parallel lines if total edge count > 12)
}}
Do NOT output code blocks (like ```json), markdown, or any explanations. Just the raw JSON.
"""

            headers = {
                "Content-Type": "application/json"
            }
            payload = {
                "contents": [{
                    "parts": [{"text": prompt}]
                }],
                "generationConfig": {
                    "responseMimeType": "application/json"
                }
            }

            # If the URL already contains key, use it, otherwise append
            url = self.api_url
            if "?key=" not in url and "&key=" not in url:
                url = f"{url}?key={self.api_key}"

            print("Calling Gemini to analyze diagram layout density...")
            with httpx.Client(timeout=12.0) as client:
                response = client.post(url, json=payload, headers=headers)
                if response.status_code == 200:
                    res_json = response.json()
                    text = res_json['candidates'][0]['content']['parts'][0]['text'].strip()
                    hints = json.loads(text)
                    print(f"Gemini layout hints generated: {hints}")
                    return hints
                else:
                    print(f"Gemini API returned status {response.status_code}: {response.text}")
        except Exception as e:
            print(f"Failed to check diagram layout via Gemini: {e}")

        return {"extra_padding": 0, "extra_edge_spacing": 0, "extra_node_spacing": 0}
