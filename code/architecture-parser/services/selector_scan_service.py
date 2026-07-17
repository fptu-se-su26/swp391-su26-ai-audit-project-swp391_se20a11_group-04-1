import os
import re
from typing import Dict, List

class SelectorScanService:
    """
    Scans frontend source files (.jsx, .tsx, .vue, .html) to extract
    interactive element attributes (data-testid, id, name, aria-label, placeholder).
    Groups results by relative file path to provide context for AI test case generation.
    """

    FRONTEND_EXTS = {'.jsx', '.tsx', '.vue', '.html', '.htm'}

    EXCLUDED_DIRS = {
        'node_modules', '.git', 'dist', 'build', '.next', '.nuxt',
        'venv', '.venv', 'coverage', '__pycache__', '.cache', 'out', 'target'
    }

    # Max files to scan (prevent overly large prompts)
    MAX_FILES = 150

    # Max unique selectors per attribute per file
    MAX_SELECTORS_PER_ATTR = 30

    # Regex patterns for each attribute type.
    # Each pattern captures the value in group 1.
    ATTR_PATTERNS: Dict[str, List[str]] = {
        'data-testid': [
            r'data-testid=["\']([^"\']+)["\']',              # data-testid="submit-btn"
            r'data-testid=\{["\']([^"\']+)["\']\}',          # data-testid={'submit-btn'}
            r"data-testid=`([^`]+)`",                         # data-testid=`submit-btn`
        ],
        'id': [
            r'\bid=["\']([^"\']+)["\']',                      # id="email-input"
            r'\bid=\{["\']([^"\']+)["\']\}',                  # id={'email-input'}
        ],
        'name': [
            r'\bname=["\']([^"\']+)["\']',                    # name="password"
            r'\bname=\{["\']([^"\']+)["\']\}',                # name={'password'}
        ],
        'aria-label': [
            r'aria-label=["\']([^"\']+)["\']',                # aria-label="Close"
            r'aria-label=\{["\']([^"\']+)["\']\}',            # aria-label={'Close'}
        ],
        'placeholder': [
            r'placeholder=["\']([^"\']+)["\']',               # placeholder="Enter email"
            r'placeholder=\{["\']([^"\']+)["\']\}',           # placeholder={'Enter email'}
        ],
    }

    @classmethod
    def scan(cls, clone_dir: str) -> Dict[str, Dict[str, List[str]]]:
        """
        Walk clone_dir, scan frontend files, extract element attributes.

        Returns:
            {
                "src/pages/LoginPage.jsx": {
                    "data-testid": ["email-input", "password-input", "login-btn"],
                    "placeholder": ["Enter your email", "Enter password"]
                },
                ...
            }
        """
        result: Dict[str, Dict[str, List[str]]] = {}
        file_count = 0

        for root, dirs, files in os.walk(clone_dir):
            # Prune excluded directories in-place
            dirs[:] = [d for d in dirs if d not in cls.EXCLUDED_DIRS]

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

                attrs = cls._extract_attrs(content)
                if attrs:  # only add files that have at least one match
                    result[rel_path] = attrs
                    file_count += 1

            if file_count >= cls.MAX_FILES:
                break

        return result

    @classmethod
    def _extract_attrs(cls, content: str) -> Dict[str, List[str]]:
        """Extract all known attributes from a single file's content."""
        attrs: Dict[str, List[str]] = {}

        for attr_name, patterns in cls.ATTR_PATTERNS.items():
            found: List[str] = []
            for pattern in patterns:
                matches = re.findall(pattern, content, re.IGNORECASE)
                for m in matches:
                    value = m.strip()
                    # Skip empty, dynamic expressions, or suspiciously long values
                    if value and not value.startswith('{') and len(value) <= 80:
                        if value not in found:
                            found.append(value)

            if found:
                # Deduplicate and limit
                attrs[attr_name] = found[:cls.MAX_SELECTORS_PER_ATTR]

        return attrs

    @classmethod
    def compute_stats(cls, selector_map: Dict[str, Dict[str, List[str]]]) -> Dict:
        """Compute summary statistics for the scan result."""
        total_selectors = 0
        for file_attrs in selector_map.values():
            for values in file_attrs.values():
                total_selectors += len(values)

        return {
            'totalFiles': len(selector_map),
            'totalSelectors': total_selectors,
        }

    @classmethod
    def format_for_prompt(cls, selector_map: Dict[str, Dict[str, List[str]]]) -> str:
        """
        Format selector_map into a concise text block suitable for inclusion in a Gemini prompt.

        Example output:
            SOURCE CODE SELECTORS (extracted from GitHub frontend source):
            Use these EXACT attributes in UI test case selectors. Do not invent selectors not listed here.

            src/pages/LoginPage.jsx:
              data-testid: email-input, password-input, login-submit-btn
              placeholder: Enter your email, Enter your password

            src/pages/DashboardPage.jsx:
              data-testid: create-project-btn, project-card, ...
        """
        if not selector_map:
            return ''

        lines = [
            'SOURCE CODE SELECTORS (extracted from GitHub frontend source):',
            'Use these EXACT attributes in UI test case selectors. Do not invent selectors not listed here.',
            '',
        ]

        for rel_path, attrs in selector_map.items():
            lines.append(f'{rel_path}:')
            for attr_name, values in attrs.items():
                # Keep the line compact — join with ", " and truncate if too many
                display_values = values[:20]
                suffix = ', ...' if len(values) > 20 else ''
                lines.append(f'  {attr_name}: {", ".join(display_values)}{suffix}')
            lines.append('')  # blank line between files

        return '\n'.join(lines)
