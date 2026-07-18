import os
import re
from typing import Dict, List, Optional

# ---------------------------------------------------------------------------
# FormMapService
# ---------------------------------------------------------------------------
# Instead of returning a flat list of attribute values, this service extracts
# fully-structured form element objects with all their attributes together.
#
# Output shape per file:
# {
#   "web/WEB-INF/views/auth/login.jsp": {
#     "forms": [
#       {
#         "action": "login",
#         "method": "POST",
#         "elements": [
#           {
#             "tag": "input",
#             "type": "text",
#             "name": "input",
#             "id": "input",
#             "placeholder": null,
#             "aria_label": null,
#             "data_testid": null,
#             "label": "Username or Email",   <- matched <label for="input">
#             "selector": "[name='input']",   <- best selector, pre-computed
#             "role": "username_field"        <- semantic role hint
#           },
#           ...
#         ]
#       }
#     ]
#   }
# }
#
# The `selector` field is the EXACT string Playwright should use.
# The `role` field is a best-effort semantic hint (username_field, password_field,
# submit_button, etc.) to help AI map elements to test steps without guessing.
# ---------------------------------------------------------------------------


class FormMapService:
    FRONTEND_EXTS = {
        '.jsp', '.jspx', '.jspf', '.tag',
        '.html', '.htm', '.xhtml',
        '.jsx', '.tsx', '.vue', '.svelte',
        '.php', '.phtml',
        '.erb', '.haml',
        '.cshtml', '.razor',
        '.ftl', '.twig', '.vm',
    }

    EXCLUDED_DIRS = {
        'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
        'venv', '.venv', 'coverage', '__pycache__', '.cache', 'out', 'target',
        'WEB-INF/lib', 'META-INF',
    }

    MAX_FILES = 80

    # Semantic role detection — maps known name/id/type combos to human-readable roles
    ROLE_HINTS = {
        # username / login identifier
        ('name', 'input'):          'username_or_email_field',
        ('name', 'username'):       'username_field',
        ('name', 'email'):          'email_field',
        ('name', 'password'):       'password_field',
        ('name', 'repassword'):     'confirm_password_field',
        ('name', 'confirmpassword'):'confirm_password_field',
        ('name', 'remember'):       'remember_me_checkbox',
        ('name', 'phone'):          'phone_field',
        ('name', 'fullname'):       'fullname_field',
        ('name', 'name'):           'name_field',
        ('name', 'otp'):            'otp_hidden_field',
        # by id
        ('id', 'input'):            'username_or_email_field',
        ('id', 'email'):            'email_field',
        ('id', 'password'):         'password_field',
        ('id', 'repassword'):       'confirm_password_field',
    }

    # Detects submit buttons
    SUBMIT_TEXT_PATTERNS = re.compile(
        r'\b(sign\s*in|login|log\s*in|submit|send|register|sign\s*up|verify|update|confirm|reset|continue)\b',
        re.IGNORECASE
    )

    @classmethod
    def scan(cls, clone_dir: str) -> Dict[str, dict]:
        """
        Walk clone_dir, parse frontend files, extract structured form maps.
        Returns dict keyed by relative file path.
        """
        result: Dict[str, dict] = {}
        file_count = 0

        for root, dirs, files in os.walk(clone_dir):
            # Prune excluded dirs in-place
            dirs[:] = [
                d for d in dirs
                if d not in cls.EXCLUDED_DIRS
                and not any(excl in os.path.join(root, d) for excl in cls.EXCLUDED_DIRS)
            ]

            for filename in files:
                if file_count >= cls.MAX_FILES:
                    break
                _, ext = os.path.splitext(filename)
                if ext.lower() not in cls.FRONTEND_EXTS:
                    continue

                full_path = os.path.join(root, filename)
                rel_path = os.path.relpath(full_path, clone_dir).replace('\\', '/')

                try:
                    with open(full_path, 'r', encoding='utf-8', errors='ignore') as f:
                        content = f.read()
                except Exception:
                    continue

                forms = cls._extract_forms(content)
                if forms:
                    result[rel_path] = {'forms': forms}
                    file_count += 1

            if file_count >= cls.MAX_FILES:
                break

        return result

    # ------------------------------------------------------------------
    # Internal: extract all <form> blocks from a file
    # ------------------------------------------------------------------
    @classmethod
    def _extract_forms(cls, content: str) -> List[dict]:
        forms = []

        # First, build a label map: {for_value -> label_text}
        label_map = cls._build_label_map(content)

        # Find all <form ...> ... </form> blocks (DOTALL, case-insensitive)
        # Also handles JSF/Thymeleaf forms that may use <h:form> or <form:form>
        form_pattern = re.compile(
            r'<(?:\w+:)?form([^>]*?)>(.*?)</(?:\w+:)?form>',
            re.IGNORECASE | re.DOTALL
        )

        for form_match in form_pattern.finditer(content):
            form_attrs_str = form_match.group(1)
            form_body = form_match.group(2)

            action = cls._get_attr(form_attrs_str, 'action') or ''
            method = (cls._get_attr(form_attrs_str, 'method') or 'GET').upper()

            elements = cls._extract_elements(form_body, label_map)
            if elements:
                forms.append({
                    'action': action,
                    'method': method,
                    'elements': elements,
                })

        # Fallback: if no <form> tags found, scan the entire file for interactive elements
        # (handles single-page components like React where form may be conditional)
        if not forms:
            elements = cls._extract_elements(content, label_map)
            if elements:
                forms.append({
                    'action': '',
                    'method': '',
                    'elements': elements,
                })

        return forms

    # ------------------------------------------------------------------
    # Internal: extract <input>, <select>, <textarea>, <button> from a block
    # ------------------------------------------------------------------
    @classmethod
    def _extract_elements(cls, html: str, label_map: Dict[str, str]) -> List[dict]:
        elements = []

        # ---- input tags (self-closing) ----
        # Handles: <input ... />, <input ...>, multi-line, JSP EL, JSTL
        input_pattern = re.compile(
            r'<input\b([^>]*?)(?:/>|>)',
            re.IGNORECASE | re.DOTALL
        )
        for m in input_pattern.finditer(html):
            tag_attrs = m.group(1)
            elem = cls._parse_element('input', tag_attrs, label_map, inner_text='')
            if elem:
                elements.append(elem)

        # ---- select tags ----
        select_pattern = re.compile(
            r'<select\b([^>]*?)>.*?</select>',
            re.IGNORECASE | re.DOTALL
        )
        for m in select_pattern.finditer(html):
            tag_attrs = m.group(1)
            elem = cls._parse_element('select', tag_attrs, label_map, inner_text='')
            if elem:
                elements.append(elem)

        # ---- textarea tags ----
        textarea_pattern = re.compile(
            r'<textarea\b([^>]*?)>.*?</textarea>',
            re.IGNORECASE | re.DOTALL
        )
        for m in textarea_pattern.finditer(html):
            tag_attrs = m.group(1)
            elem = cls._parse_element('textarea', tag_attrs, label_map, inner_text='')
            if elem:
                elements.append(elem)

        # ---- button tags ----
        button_pattern = re.compile(
            r'<button\b([^>]*?)>(.*?)</button>',
            re.IGNORECASE | re.DOTALL
        )
        for m in button_pattern.finditer(html):
            tag_attrs = m.group(1)
            # Strip tags from inner text to get button label
            inner_text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
            elem = cls._parse_element('button', tag_attrs, label_map, inner_text=inner_text)
            if elem:
                elements.append(elem)

        return elements

    # ------------------------------------------------------------------
    # Internal: parse a single element's attributes into structured dict
    # ------------------------------------------------------------------
    @classmethod
    def _parse_element(cls, tag: str, attrs_str: str,
                        label_map: Dict[str, str], inner_text: str) -> Optional[dict]:
        input_type  = (cls._get_attr(attrs_str, 'type') or ('submit' if tag == 'button' else 'text')).lower()
        name        = cls._get_attr(attrs_str, 'name')
        elem_id     = cls._get_attr(attrs_str, 'id')
        placeholder = cls._get_attr(attrs_str, 'placeholder')
        aria_label  = cls._get_attr(attrs_str, 'aria-label')
        data_testid = cls._get_attr(attrs_str, 'data-testid')

        # Skip purely decorative / hidden non-form elements
        if input_type == 'hidden' and not name:
            return None
        # Skip meta-like inputs
        if tag == 'input' and input_type in ('hidden',) and name and name.startswith('_'):
            return None

        # Resolve label from <label for="..."> map
        label_text = None
        if elem_id and elem_id in label_map:
            label_text = label_map[elem_id]
        elif name and name in label_map:
            label_text = label_map[name]

        # Determine best Playwright selector (priority: data-testid > name > id > aria-label)
        selector = cls._best_selector(data_testid, name, elem_id, aria_label, placeholder,
                                       tag, input_type, inner_text)

        # Determine semantic role
        role = cls._infer_role(tag, input_type, name, elem_id, inner_text,
                                label_text, aria_label, placeholder)

        # Build the element object
        elem: dict = {
            'tag': tag,
            'type': input_type,
            'selector': selector,
            'role': role,
        }
        if name:        elem['name']        = name
        if elem_id:     elem['id']          = elem_id
        if placeholder: elem['placeholder'] = placeholder
        if aria_label:  elem['aria_label']  = aria_label
        if data_testid: elem['data_testid'] = data_testid
        if label_text:  elem['label']       = label_text
        if inner_text:  elem['text']        = inner_text

        return elem

    # ------------------------------------------------------------------
    # Compute the best Playwright selector for this element
    # ------------------------------------------------------------------
    @classmethod
    def _best_selector(cls, data_testid: Optional[str], name: Optional[str],
                        elem_id: Optional[str], aria_label: Optional[str],
                        placeholder: Optional[str], tag: str, input_type: str,
                        inner_text: str) -> str:
        if data_testid:
            return f"[data-testid='{data_testid}']"
        if name:
            return f"[name='{name}']"
        if elem_id:
            return f"#{elem_id}"
        if aria_label:
            return f"[aria-label='{aria_label}']"
        if placeholder:
            return f"[placeholder='{placeholder}']"
        if inner_text and tag == 'button':
            clean = inner_text[:50].strip()
            if clean:
                return f"button:has-text('{clean}')"
        if tag == 'button' and input_type == 'submit':
            return "button[type='submit']"
        if input_type == 'submit':
            return "input[type='submit']"
        return f"{tag}[type='{input_type}']"

    # ------------------------------------------------------------------
    # Infer a human-readable semantic role
    # ------------------------------------------------------------------
    @classmethod
    def _infer_role(cls, tag: str, input_type: str, name: Optional[str],
                     elem_id: Optional[str], inner_text: str, label_text: Optional[str],
                     aria_label: Optional[str], placeholder: Optional[str]) -> str:
        # Check submit buttons first
        if input_type in ('submit', 'button') or tag == 'button':
            label = (inner_text or label_text or aria_label or '').lower()
            if cls.SUBMIT_TEXT_PATTERNS.search(label):
                return f"submit_button ({label.strip()[:30]})"
            if input_type == 'submit':
                return 'submit_button'

        # Check by name
        if name:
            key = ('name', name.lower())
            if key in cls.ROLE_HINTS:
                return cls.ROLE_HINTS[key]

        # Check by id
        if elem_id:
            key = ('id', elem_id.lower())
            if key in cls.ROLE_HINTS:
                return cls.ROLE_HINTS[key]

        # Infer from label / placeholder text
        combined = ' '.join(filter(None, [label_text, placeholder, aria_label])).lower()
        if 'email' in combined:       return 'email_field'
        if 'password' in combined:    return 'password_field'
        if 'username' in combined:    return 'username_field'
        if 'confirm' in combined:     return 'confirm_password_field'
        if 'remember' in combined:    return 'remember_me_checkbox'
        if 'phone' in combined:       return 'phone_field'
        if 'otp' in combined or 'code' in combined: return 'otp_field'

        # Fallback
        if input_type == 'checkbox':  return 'checkbox'
        if input_type == 'radio':     return 'radio'
        if input_type == 'password':  return 'password_field'
        if input_type == 'email':     return 'email_field'
        if tag == 'select':           return 'dropdown'
        if tag == 'textarea':         return 'textarea'
        return f'{tag}_{input_type}' if input_type != 'text' else 'text_input'

    # ------------------------------------------------------------------
    # Build {for_value -> label_text} map from <label for="..."> tags
    # ------------------------------------------------------------------
    @classmethod
    def _build_label_map(cls, content: str) -> Dict[str, str]:
        label_map: Dict[str, str] = {}
        pattern = re.compile(
            r'<label[^>]*\bfor=["\']([^"\']+)["\'][^>]*>(.*?)</label>',
            re.IGNORECASE | re.DOTALL
        )
        for m in pattern.finditer(content):
            for_val = m.group(1).strip()
            # Strip inner HTML tags and whitespace to get clean label text
            label_text = re.sub(r'<[^>]+>', '', m.group(2)).strip()
            label_text = re.sub(r'\s+', ' ', label_text)
            if for_val and label_text:
                label_map[for_val] = label_text
        return label_map

    # ------------------------------------------------------------------
    # Get a single attribute value from an attribute string
    # ------------------------------------------------------------------
    @classmethod
    def _get_attr(cls, attrs_str: str, attr_name: str) -> Optional[str]:
        # Handles: attr="val", attr='val', attr={val}, attr={'val'}, attr=`val`
        patterns = [
            rf'\b{re.escape(attr_name)}\s*=\s*"([^"]*)"',
            rf'\b{re.escape(attr_name)}\s*=\s*\'([^\']*)\'',
            rf'\b{re.escape(attr_name)}\s*=\s*\{{["\']([^"\']+)["\']\}}',
            rf'\b{re.escape(attr_name)}\s*=\s*`([^`]*)`',
        ]
        for p in patterns:
            m = re.search(p, attrs_str, re.IGNORECASE | re.DOTALL)
            if m:
                val = m.group(1).strip()
                # Skip EL / template expressions that weren't resolved
                if val.startswith('${') or val.startswith('#{') or val.startswith('{{'):
                    return None
                return val if val else None
        return None

    # ------------------------------------------------------------------
    # Format the form map for injection into a Gemini prompt
    # ------------------------------------------------------------------
    @classmethod
    def format_for_prompt(cls, form_map: Dict[str, dict]) -> str:
        """
        Converts structured form map into a deterministic text block for Gemini.

        Example output:
            STRUCTURED FORM MAP — extracted from actual source code.
            Use the 'selector' field VERBATIM in every UI test step. Do NOT change it.

            FILE: web/WEB-INF/views/auth/login.jsp
            FORM action="login" method="POST"
              [username_or_email_field] tag=input type=text name="input" id="input"
                label: "Username or Email"
                SELECTOR (use this exactly): [name='input']
              [password_field] tag=input type=password name="password" id="password"
                label: "Password"
                SELECTOR (use this exactly): [name='password']
              [remember_me_checkbox] tag=input type=checkbox name="remember"
                SELECTOR (use this exactly): [name='remember']
              [submit_button (sign in)] tag=button type=submit
                text: "Sign In"
                SELECTOR (use this exactly): button:has-text('Sign In')
        """
        if not form_map:
            return ''

        lines = [
            'STRUCTURED FORM MAP — extracted verbatim from actual source code.',
            'RULE: Copy the SELECTOR value CHARACTER FOR CHARACTER into test steps. No changes allowed.',
            '',
        ]

        for rel_path, file_data in form_map.items():
            lines.append(f'FILE: {rel_path}')
            for form in file_data.get('forms', []):
                action = form.get('action', '')
                method = form.get('method', '')
                header = 'FORM'
                if action: header += f' action="{action}"'
                if method: header += f' method="{method}"'
                lines.append(f'  {header}')

                for elem in form.get('elements', []):
                    role    = elem.get('role', 'unknown')
                    tag     = elem.get('tag', 'input')
                    etype   = elem.get('type', 'text')
                    sel     = elem.get('selector', '')
                    name    = elem.get('name', '')
                    eid     = elem.get('id', '')
                    label   = elem.get('label', '')
                    ph      = elem.get('placeholder', '')
                    text    = elem.get('text', '')

                    meta = f'tag={tag} type={etype}'
                    if name: meta += f' name="{name}"'
                    if eid:  meta += f' id="{eid}"'

                    lines.append(f'    [{role}] {meta}')
                    if label: lines.append(f'      label: "{label}"')
                    if ph:    lines.append(f'      placeholder: "{ph}"')
                    if text:  lines.append(f'      text: "{text}"')
                    lines.append(f'      SELECTOR (use this exactly): {sel}')

            lines.append('')  # blank line between files

        return '\n'.join(lines)

    @classmethod
    def compute_stats(cls, form_map: Dict[str, dict]) -> dict:
        total_elements = sum(
            len(form.get('elements', []))
            for fd in form_map.values()
            for form in fd.get('forms', [])
        )
        return {
            'totalFiles': len(form_map),
            'totalElements': total_elements,
        }
