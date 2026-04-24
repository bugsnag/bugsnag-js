/**
 * Custom ESLint rule to prevent inline type exports like `export { type Bugsnag }`
 * and enforce top-level type exports like `export type { Bugsnag }`
 */
module.exports = {
  meta: {
    type: 'suggestion',
    docs: {
      description: 'Prevent inline type exports and enforce top-level type exports',
      category: 'Stylistic Issues',
      recommended: false,
    },
    fixable: 'code',
    schema: [],
    messages: {
      noInlineTypeExport: 'Use top-level type exports instead of inline type specifiers. Change `export { type {{name}} }` to `export type { {{name}} }`.',
    },
  },

  create(context) {
    return {
      ExportNamedDeclaration(node) {
        // Check if this is an export with specifiers (export { ... })
        if (node.specifiers && node.specifiers.length > 0) {
          const typeSpecifiers = [];
          const valueSpecifiers = [];

          // Separate type and value specifiers
          node.specifiers.forEach(specifier => {
            if (specifier.exportKind === 'type') {
              typeSpecifiers.push(specifier);
            } else {
              valueSpecifiers.push(specifier);
            }
          });

          // If we have inline type specifiers, report them
          if (typeSpecifiers.length > 0) {
            typeSpecifiers.forEach(specifier => {
              context.report({
                node: specifier,
                messageId: 'noInlineTypeExport',
                data: {
                  name: specifier.exported.name,
                },
                fix(fixer) {
                  const sourceCode = context.getSourceCode();
                  
                  // If this export only contains type specifiers, convert to export type
                  if (valueSpecifiers.length === 0) {
                    // Replace "export {" with "export type {"
                    const exportToken = sourceCode.getFirstToken(node);
                    
                    const fixes = [
                      // Add "type" after "export"
                      fixer.insertTextAfter(exportToken, ' type'),
                    ];

                    // Remove "type" from each specifier
                    typeSpecifiers.forEach(spec => {
                      const typeToken = sourceCode.getFirstToken(spec);
                      if (typeToken.value === 'type') {
                        const nextToken = sourceCode.getTokenAfter(typeToken);
                        fixes.push(fixer.removeRange([typeToken.range[0], nextToken.range[0]]));
                      }
                    });

                    return fixes;
                  } else {
                    // Mixed exports: split into separate export statements
                    
                    // Create separate export type statement
                    const typeNames = typeSpecifiers.map(spec => spec.exported.name).join(', ');
                    const typeExport = `export type { ${typeNames} };`;
                    
                    // Create value export statement
                    const valueNames = valueSpecifiers.map(spec => {
                      if (spec.local.name === spec.exported.name) {
                        return spec.exported.name;
                      } else {
                        return `${spec.local.name} as ${spec.exported.name}`;
                      }
                    }).join(', ');
                    const valueExport = `export { ${valueNames} };`;

                    // Replace the entire export with both statements
                    return fixer.replaceText(node, `${typeExport}\n${valueExport}`);
                  }
                },
              });
            });
          }
        }
      },
    };
  },
};
