module.exports = function debugComponentPlugin(babel) {
  const { types: t } = babel;

  const ALLOWED_HTML_TAGS = [
    "div",
    "section",
    "main",
    "header",
    "footer",
    "form",
    "button",
    "a",
    "h1",
    "h2",
    "h3",
    "h4",
    "h5",
    "h6",
    "p",
    "span",
    "label",
    "input",
    "textarea",
    "select",
    "option",
    "ul",
    "ol",
    "li",
    "img",
    "svg",
    "nav",
  ];

  function toProjectPath(filename) {
    return filename
      .replace(process.cwd(), "")
      .replace(/\\/g, "/")
      .replace(/^\//, "");
  }

  function isProjectFile(filename) {
    if (!filename) return false;

    const normalized = filename.replace(/\\/g, "/");

    if (normalized.includes("/node_modules/")) return false;
    if (normalized.includes("/.next/")) return false;

    return (
      normalized.includes("/app/") ||
      normalized.includes("/components/") ||
      normalized.includes("/features/") ||
      normalized.includes("/hooks/") ||
      normalized.includes("/lib/") ||
      normalized.includes("/src/")
    );
  }

  function hasAttribute(node, attrName) {
    return node.attributes.some(
      (attr) =>
        t.isJSXAttribute(attr) &&
        t.isJSXIdentifier(attr.name) &&
        attr.name.name === attrName
    );
  }

  function getJsxName(nameNode) {
    if (t.isJSXIdentifier(nameNode)) return nameNode.name;

    if (t.isJSXMemberExpression(nameNode)) {
      return getJsxName(nameNode.property);
    }

    return null;
  }

  function isAllowedElement(nameNode) {
    const name = getJsxName(nameNode);
    if (!name) return false;

    const isAllowedHtml = ALLOWED_HTML_TAGS.includes(name);
    const isCustomComponent = /^[A-Z]/.test(name);

    return isAllowedHtml || isCustomComponent;
  }

  function findComponentName(path) {
    const fn = path.findParent(
      (p) =>
        p.isFunctionDeclaration() ||
        p.isFunctionExpression() ||
        p.isArrowFunctionExpression()
    );

    if (!fn) return "UnknownComponent";

    if (fn.node.id?.name) return fn.node.id.name;

    const variable = fn.findParent((p) => p.isVariableDeclarator());
    if (variable?.node?.id?.name) return variable.node.id.name;

    return "AnonymousComponent";
  }

  return {
    visitor: {
      JSXOpeningElement(path, state) {
        if (process.env.NODE_ENV !== "development") return;

        const filename = state.file.opts.filename;
        if (!isProjectFile(filename)) return;

        if (!isAllowedElement(path.node.name)) return;

        if (hasAttribute(path.node, "data-component-path")) return;

        const projectPath = toProjectPath(filename);
        const fileNameOnly = projectPath.split("/").pop();
        const line = path.node.loc?.start?.line ?? 0;
        const column = path.node.loc?.start?.column ?? 0;
        const componentName = findComponentName(path);

        path.node.attributes.push(
          t.jsxAttribute(
            t.jsxIdentifier("data-lov-id"),
            t.stringLiteral(`${projectPath}:${line}:${column}`)
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-component-path"),
            t.stringLiteral(projectPath)
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-component-file"),
            t.stringLiteral(fileNameOnly)
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-component-line"),
            t.stringLiteral(String(line))
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-component-column"),
            t.stringLiteral(String(column))
          ),
          t.jsxAttribute(
            t.jsxIdentifier("data-component-name"),
            t.stringLiteral(componentName)
          )
        );
      },
    },
  };
};