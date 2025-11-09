// src/utils/parseToGraph.js

function codeToAlgorithm(line, language = 'python') {
  // Convert code statements to high-level algorithmic descriptions
  
  // Print/Output statements
  if (/print\(|console\.log\(|System\.out\.println\(|printf\(|cout\s*<</.test(line)) {
    const content = line.match(/["']([^"']+)["']/);
    if (content && content[1]) {
      return `Print "${content[1]}"`;
    }
    // Check for variable printing
    const varMatch = line.match(/print\((\w+)\)|console\.log\((\w+)\)|println\((\w+)\)/);
    if (varMatch) {
      const varName = varMatch[1] || varMatch[2] || varMatch[3];
      return `Print ${varName}`;
    }
    return 'Print result';
  }
  
  // Function/Method definitions
  if (/^def\s+(\w+)|^function\s+(\w+)|^static\s+void\s+(\w+)|^void\s+(\w+)/.test(line)) {
    const funcMatch = line.match(/(?:def|function|void)\s+(\w+)\(([^)]*)\)/);
    if (funcMatch) {
      const params = funcMatch[2];
      return params ? `Get input: ${params}` : `Start process`;
    }
    return `Start`;
  }
  
  // Conditional statements - human readable
  if (/^if\s+/.test(line) || /^if\s*\(/.test(line)) {
    let condition = line.replace(/^if\s+/, '').replace(/^if\s*\(\s*/, '').replace(/[:\{].*$/, '').replace(/\s*\)\s*$/, '').trim();
    
    // Convert to plain English
    if (/(\w+)\s*%\s*2\s*===?\s*0/.test(condition)) {
      const match = condition.match(/(\w+)\s*%\s*2/);
      return match ? `Is ${match[1]} even?` : 'Is number even?';
    } else if (/(\w+)\s*%\s*2\s*!==?\s*0/.test(condition)) {
      const match = condition.match(/(\w+)\s*%\s*2/);
      return match ? `Is ${match[1]} odd?` : 'Is number odd?';
    } else if (/(\w+)\s*%\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*%\s*(\w+)/);
      return `Is ${match[1]} % ${match[2]} = 0?`;
    } else if (/(\w+)\s*>\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*>\s*(\w+)/);
      return `Is ${match[1]} > ${match[2]}?`;
    } else if (/(\w+)\s*<\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*<\s*(\w+)/);
      return `Is ${match[1]} < ${match[2]}?`;
    } else if (/(\w+)\s*>=\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*>=\s*(\w+)/);
      return `Is ${match[1]} ≥ ${match[2]}?`;
    } else if (/(\w+)\s*<=\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*<=\s*(\w+)/);
      return `Is ${match[1]} ≤ ${match[2]}?`;
    } else if (/(\w+)\s*===?\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*===?\s*(\w+)/);
      return `Is ${match[1]} = ${match[2]}?`;
    } else if (/(\w+)\s*!==?\s*(\w+)/.test(condition)) {
      const match = condition.match(/(\w+)\s*!==?\s*(\w+)/);
      return `Is ${match[1]} ≠ ${match[2]}?`;
    } else if (/(\w+)\.length/.test(condition) || /len\((\w+)\)/.test(condition)) {
      return 'Is list empty?';
    }
    
    // Clean up condition for display
    condition = condition.replace(/===?/g, '=').replace(/!==?/g, '≠');
    return `Check: ${condition}`;
  }
  
  if (/^elif\s+/.test(line)) {
    let condition = line.replace(/^elif\s+/, '').replace(/[:\{].*$/, '').trim();
    condition = condition.replace(/===?/g, '=').replace(/!==?/g, '≠');
    return `Else if: ${condition}`;
  }
  
  if (/^else[:\{]?/.test(line)) {
    return 'Otherwise';
  }
  
  // Loop statements - simplified
  if (/^for\s+/.test(line) || /^for\s*\(/.test(line)) {
    // Handle Java/C/JavaScript style: for (int i = 0; i < 5; i++)
    const javaForMatch = line.match(/for\s*\(\s*(?:int|let|var)?\s*\w+\s*=\s*\d+\s*;\s*\w+\s*<\s*(\d+)/);
    if (javaForMatch) {
      return `Repeat ${javaForMatch[1]} times`;
    }
    
    const javaForMatch2 = line.match(/for\s*\(\s*(?:int|let|var)?\s*\w+\s*=\s*(\d+)\s*;\s*\w+\s*<=\s*(\d+)/);
    if (javaForMatch2) {
      const count = parseInt(javaForMatch2[2]) - parseInt(javaForMatch2[1]) + 1;
      return `Repeat ${count} times`;
    }
    
    // Python style
    const rangeMatch = line.match(/range\((\d+)\)/);
    const toMatch = line.match(/to\s+(\d+)/i);
    const lengthMatch = line.match(/(\w+)\.length|len\((\w+)\)/);
    const inMatch = line.match(/for\s+\w+\s+in\s+(\w+)/);
    
    if (rangeMatch) {
      return `Repeat ${rangeMatch[1]} times`;
    } else if (toMatch) {
      return `Repeat ${toMatch[1]} times`;
    } else if (lengthMatch) {
      const varName = lengthMatch[1] || lengthMatch[2];
      return `For each in ${varName}`;
    } else if (inMatch) {
      return `For each in ${inMatch[1]}`;
    }
    
    const countMatch = line.match(/i\s*<\s*(\d+)|i\s*<=\s*(\d+)/);
    const count = countMatch ? (countMatch[1] || countMatch[2]) : 'N';
    return `Repeat ${count} times`;
  }
  
  if (/^while\s+/.test(line)) {
    let condition = line.replace(/^while\s+/, '').replace(/[:\{].*$/, '').trim();
    if (condition === 'true' || condition === 'True') {
      return 'Repeat forever';
    }
    condition = condition.replace(/===?/g, '=').replace(/!==?/g, '≠');
    return `While ${condition}`;
  }
  
  // Return statements
  if (/^return\b/.test(line)) {
    const valueMatch = line.match(/return\s+(.+)/);
    if (valueMatch && valueMatch[1].trim() !== ';') {
      const value = valueMatch[1].replace(/;$/, '').trim();
      if (value.length < 30) {
        return `Return ${value}`;
      }
    }
    return 'Return result';
  }
  
  // Variable assignments - describe operation
  if (/(\w+)\s*=\s*/.test(line) && !/===?|!==?/.test(line)) {
    const assignMatch = line.match(/(\w+)\s*=\s*(.+)/);
    if (assignMatch) {
      const varName = assignMatch[1];
      const value = assignMatch[2].replace(/;$/, '').trim();
      
      // Check for mathematical operations
      if (/[\+\-\*\/]/.test(value)) {
        return `Calculate ${varName}`;
      } else if (/^\d+$/.test(value)) {
        return `Set ${varName} = ${value}`;
      } else if (value.length < 20) {
        return `${varName} = ${value}`;
      }
      return `Assign ${varName}`;
    }
  }
  
  // Function calls - simplified
  if (/(\w+)\([^)]*\)/.test(line) && !line.startsWith('if') && !line.startsWith('for') && !line.startsWith('while')) {
    const funcMatch = line.match(/(\w+)\(/);
    if (funcMatch) {
      const funcName = funcMatch[1];
      
      // Skip common built-ins that are handled elsewhere
      if (['print', 'console', 'println', 'printf'].includes(funcName)) {
        return 'Output';
      }
      
      // Convert function name to readable text
      const readable = funcName
        .replace(/_/g, ' ')
        .replace(/([A-Z])/g, ' $1')
        .trim()
        .toLowerCase();
      
      return `Call ${readable}`;
    }
  }
  
  // Array/List operations
  if (/\.append\(|\.push\(|\.add\(/.test(line)) {
    return 'Add to list';
  }
  
  if (/\.pop\(|\.remove\(/.test(line)) {
    return 'Remove from list';
  }
  
  if (/\.sort\(/.test(line)) {
    return 'Sort list';
  }
  
  // Default - try to make it readable
  const shortLine = line.substring(0, 40);
  if (shortLine.length < line.length) {
    return shortLine + '...';
  }
  return line || 'Process step';
}

export function parseToGraph(code) {
  // Detect language first
  let language = 'python';
  if (/function\s+\w+|console\.log|let\s+|const\s+|var\s+/.test(code)) language = 'javascript';
  else if (/System\.out\.println|public\s+static|public\s+class|class\s+\w+\s*\{/.test(code)) language = 'java';
  else if (/#include|printf|cout/.test(code)) language = 'c';
  else if (/SELECT|FROM|WHERE|INSERT|UPDATE|DELETE/i.test(code)) language = 'sql';
  else if (/<html|<head|<body|<div|<style/i.test(code)) language = 'html';
  
  const rawLines = code.split("\n");
  const lines = rawLines
    .map((l, index) => ({ 
      text: l.trim(), 
      lineNumber: index + 1, 
      indent: l.search(/\S/) >= 0 ? l.search(/\S/) : 0,
      original: l
    }))
    .filter(l => {
      const t = l.text;
      // Filter out comments, imports, and language-specific boilerplate
      if (!t.length) return false;
      if (t.startsWith("#") || t.startsWith("//")) return false;
      if (t.startsWith("import ") || t.startsWith("using ")) return false;
      
      // Java-specific filtering
      if (language === 'java' || language === 'c' || language === 'cpp' || language === 'javascript') {
        if (/^(class|public\s+class)\s+\w+\s*\{?\s*$/.test(t)) return false; // Skip class declaration
        if (/^public\s+static\s+void\s+main\s*\(/.test(t)) return false; // Skip main method declaration
        if (/^\{\s*$/.test(t)) return false; // Skip standalone opening braces
        if (/^\}\s*$/.test(t)) return false; // Skip standalone closing braces
        if (/^return\s+0\s*;?\s*$/.test(t)) return false; // Skip return 0 in C/C++
      }
      
      return true;
    });

  let nodes = [];
  let edges = [];
  let id = 1;

  // Special handling for SQL
  if (language === 'sql') {
    return parseSQLToGraph(code);
  }

  // Special handling for HTML/CSS
  if (language === 'html') {
    return parseHTMLToGraph(code);
  }

  // Add Start node
  const startNode = { 
    id: id++, 
    text: 'Start', 
    type: 'start',
    shape: 'terminal',
    lineNumber: 1
  };
  nodes.push(startNode);

  let currentNode = startNode;
  let ifStack = []; // Track if/else blocks
  let loopStack = []; // Track loops
  let afterIfNodes = []; // Nodes to connect after if-else
  
  // Helper function to create node
  const createNode = (text, type, shape, lineNum) => {
    const node = { 
      id: id++, 
      text, 
      type, 
      shape, 
      lineNumber: lineNum 
    };
    nodes.push(node);
    return node;
  };
  
  // Helper function to create edge
  const createEdge = (fromId, toId, label = "") => {
    edges.push({ from: fromId, to: toId, label });
  };

  for (let i = 0; i < lines.length; i++) {
    const lineObj = lines[i];
    const line = lineObj.text;
    const lineNumber = lineObj.lineNumber;
    const indent = lineObj.indent;

    // Skip empty lines and closing braces
    if (!line || /^[\}\)]\s*$/.test(line)) continue;

    // Check if we're exiting an if/else block
    if (ifStack.length > 0) {
      const topIf = ifStack[ifStack.length - 1];
      
      // For Python: check indentation
      if (language === 'python' && indent <= topIf.indent && !line.startsWith('elif') && !line.startsWith('else') && !line.startsWith('for') && !line.startsWith('while')) {
        ifStack.pop();
      }
      
      // For Java/C/JavaScript: check for end of block (closing brace already filtered)
      // We need to track brace depth differently
    }

    let node = null;

    // Function definition
    if (/^(def|function|void|static\s+void|public\s+static\s+void)\s+/.test(line)) {
      // Skip main method - it's just the entry point
      if (/main\s*\(/.test(line)) {
        continue;
      }
      
      const funcMatch = line.match(/\(([^)]+)\)/);
      if (funcMatch && funcMatch[1].trim()) {
        // Extract just the parameter names from Java style (int n) or Python style (n)
        const params = funcMatch[1].trim();
        
        // For Java, extract variable names from "Type varName" patterns
        let paramNames = params;
        if (language === 'java' || language === 'c' || language === 'cpp') {
          const javaParams = params.split(',').map(p => {
            const parts = p.trim().split(/\s+/);
            return parts.length > 1 ? parts[parts.length - 1] : parts[0];
          }).join(', ');
          paramNames = javaParams;
        }
        
        node = createNode(`Get input: ${paramNames}`, 'input', 'parallelogram', lineNumber);
        createEdge(currentNode.id, node.id);
        currentNode = node;
      }
      continue;
    }
    
    // If statement
    else if (/^if\s+/.test(line) || /^if\s*\(/.test(line)) {
      // Extract condition from Java/C style if (condition) or Python style if condition:
      let condition = line;
      if (/^if\s*\(/.test(line)) {
        // Java/C/JavaScript style: if (condition) or if (condition) {
        condition = line.replace(/^if\s*\(\s*/, '').replace(/\s*\)\s*\{?\s*$/, '').trim();
      } else {
        // Python style: if condition:
        condition = line.replace(/^if\s+/, '').replace(/:\s*$/, '').trim();
      }
      
      // Create readable algorithm text
      let algorithmText = codeToAlgorithm(line, language);
      
      node = createNode(algorithmText, 'decision', 'diamond', lineNumber);
      createEdge(currentNode.id, node.id);
      
      ifStack.push({
        decisionNode: node,
        indent: indent,
        yesNode: null,
        noNode: null,
        hasElse: false
      });
      currentNode = node;
    }
    
    // Elif statement
    else if (/^elif\s+/.test(line)) {
      if (ifStack.length > 0) {
        const topIf = ifStack[ifStack.length - 1];
        
        const algorithmText = codeToAlgorithm(line, language);
        node = createNode(algorithmText, 'decision', 'diamond', lineNumber);
        createEdge(topIf.decisionNode.id, node.id, "No");
        
        // Update the stack
        ifStack.pop();
        ifStack.push({
          decisionNode: node,
          indent: indent,
          yesNode: null,
          noNode: null,
          hasElse: false
        });
        currentNode = node;
      }
    }
    
    // Else statement
    else if (/^else\s*:?\s*\{?\s*$/.test(line)) {
      if (ifStack.length > 0) {
        const topIf = ifStack[ifStack.length - 1];
        topIf.hasElse = true;
        currentNode = topIf.decisionNode;
      }
      continue;
    }
    
    // For/While loop
    else if (/^(for|while)\s+/.test(line) || /^(for|while)\s*\(/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'loop', 'diamond', lineNumber);
      
      // Connect from all pending if/else nodes if they exist
      if (afterIfNodes.length > 0) {
        // Connect all branch nodes to this loop (no labels - they all flow here)
        afterIfNodes.forEach(afterNode => {
          createEdge(afterNode.id, node.id, "");
        });
        afterIfNodes = [];
      } else {
        createEdge(currentNode.id, node.id);
      }
      
      loopStack.push({
        loopNode: node,
        indent: indent
      });
      currentNode = node;
      
      // Clear ifStack since we're now in the loop
      if (ifStack.length > 0) {
        ifStack = [];
      }
    }
    
    // Print/Output statement
    else if (/print\(|console\.log\(|System\.out\.println\(|printf\(|cout\s*<</.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'output', 'parallelogram', lineNumber);
      
      // Determine edge label based on context
      let label = "";
      if (ifStack.length > 0) {
        const topIf = ifStack[ifStack.length - 1];
        if (!topIf.yesNode) {
          label = "Yes";
          topIf.yesNode = node;
          createEdge(currentNode.id, node.id, label);
          afterIfNodes.push(node);
        } else if (topIf.hasElse && !topIf.noNode) {
          label = "No";
          topIf.noNode = node;
          createEdge(currentNode.id, node.id, label);
          afterIfNodes.push(node);
        } else {
          createEdge(currentNode.id, node.id, label);
        }
      } else if (loopStack.length > 0 && currentNode.type === 'loop') {
        label = "Yes";
        createEdge(currentNode.id, node.id, label);
      } else {
        createEdge(currentNode.id, node.id, label);
      }
      
      currentNode = node;
    }
    
    // Return statement
    else if (/^return\b/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'output', 'parallelogram', lineNumber);
      createEdge(currentNode.id, node.id);
      currentNode = node;
    }
    
    // Function call
    else if (/(\w+)\([^)]*\)/.test(line) && !/^(if|for|while|elif|print|console|println)/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'process', 'rectangle', lineNumber);
      
      let label = "";
      if (loopStack.length > 0 && currentNode.type === 'loop') {
        label = "Yes";
      }
      
      createEdge(currentNode.id, node.id, label);
      currentNode = node;
    }
    
    // Variable assignment
    else if (/(\w+)\s*=\s*/.test(line) && !/===?|!==?|<=|>=/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'process', 'rectangle', lineNumber);
      
      let label = "";
      if (ifStack.length > 0) {
        const topIf = ifStack[ifStack.length - 1];
        if (!topIf.yesNode) {
          label = "Yes";
          topIf.yesNode = node;
        } else if (topIf.hasElse && !topIf.noNode) {
          label = "No";
          topIf.noNode = node;
        }
      } else if (loopStack.length > 0 && currentNode.type === 'loop') {
        label = "Yes";
      }
      
      createEdge(currentNode.id, node.id, label);
      
      if (ifStack.length > 0) {
        afterIfNodes.push(node);
      }
      
      currentNode = node;
    }
  }

  // Handle loop back edges
  if (loopStack.length > 0) {
    const loop = loopStack[loopStack.length - 1];
    if (currentNode && currentNode !== loop.loopNode) {
      createEdge(currentNode.id, loop.loopNode.id, "Loop back");
      currentNode = loop.loopNode;
    }
  }

  // Add End node
  const endNode = createNode('End', 'end', 'terminal', lines.length > 0 ? lines[lines.length - 1].lineNumber : 1);
  
  // Connect to end node
  if (loopStack.length > 0) {
    createEdge(loopStack[loopStack.length - 1].loopNode.id, endNode.id, "No");
  } else if (currentNode) {
    createEdge(currentNode.id, endNode.id);
  }

  return { nodes, edges };
}

function parseSQLToGraph(code) {
  const nodes = [];
  const edges = [];
  let id = 1;

  // Start
  nodes.push({
    id: id++,
    text: 'Start',
    type: 'start',
    shape: 'terminal',
    lineNumber: 1
  });

  let prev = nodes[0];

  // Parse SELECT statement
  if (/SELECT/i.test(code)) {
    const selectMatch = code.match(/SELECT\s+(.+?)\s+FROM/is);
    const columns = selectMatch ? selectMatch[1].trim() : '*';
    
    const node = {
      id: id++,
      text: `Select columns: ${columns}`,
      type: 'input',
      shape: 'parallelogram',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse FROM clause
  if (/FROM/i.test(code)) {
    const fromMatch = code.match(/FROM\s+(\w+)/i);
    const table = fromMatch ? fromMatch[1] : 'table';
    
    const node = {
      id: id++,
      text: `From table: ${table}`,
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse WHERE clause
  if (/WHERE/i.test(code)) {
    const whereMatch = code.match(/WHERE\s+(.+?)(?:;|$)/is);
    const condition = whereMatch ? whereMatch[1].trim().replace(/;/g, '') : 'condition';
    
    const node = {
      id: id++,
      text: `Filter: ${condition}`,
      type: 'decision',
      shape: 'diamond',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse INSERT
  if (/INSERT/i.test(code)) {
    const insertMatch = code.match(/INSERT\s+INTO\s+(\w+)/i);
    const table = insertMatch ? insertMatch[1] : 'table';
    
    const node = {
      id: id++,
      text: `Insert into: ${table}`,
      type: 'output',
      shape: 'parallelogram',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse UPDATE
  if (/UPDATE/i.test(code)) {
    const updateMatch = code.match(/UPDATE\s+(\w+)/i);
    const table = updateMatch ? updateMatch[1] : 'table';
    
    const node = {
      id: id++,
      text: `Update table: ${table}`,
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse DELETE
  if (/DELETE/i.test(code)) {
    const deleteMatch = code.match(/DELETE\s+FROM\s+(\w+)/i);
    const table = deleteMatch ? deleteMatch[1] : 'table';
    
    const node = {
      id: id++,
      text: `Delete from: ${table}`,
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }  // Result
  const resultNode = {
    id: id++,
    text: 'Return results',
    type: 'output',
    shape: 'parallelogram',
    lineNumber: 1
  };
  nodes.push(resultNode);
  edges.push({ from: prev.id, to: resultNode.id });

  // End
  const endNode = { 
    id: id++, 
    text: 'End', 
    type: 'end',
    shape: 'terminal',
    lineNumber: 1
  };
  nodes.push(endNode);
  edges.push({ from: resultNode.id, to: endNode.id });

  return { nodes, edges };
}

function parseHTMLToGraph(code) {
  const nodes = [];
  const edges = [];
  let id = 1;

  // Start
  nodes.push({ 
    id: id++, 
    text: 'Start', 
    type: 'start',
    shape: 'terminal',
    lineNumber: 1
  });

  let prev = nodes[0];

  // Parse HTML structure
  if (/<html/i.test(code)) {
    const node = {
      id: id++,
      text: 'Create HTML document',
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse head section
  if (/<head/i.test(code)) {
    const titleMatch = code.match(/<title>(.+?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : 'Document';
    
    const node = {
      id: id++,
      text: `Set title: "${title}"`,
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse body section
  if (/<body/i.test(code)) {
    const node = {
      id: id++,
      text: 'Create body content',
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse headings
  const h1Match = code.match(/<h1[^>]*>(.+?)<\/h1>/i);
  if (h1Match) {
    const node = {
      id: id++,
      text: `Display heading: "${h1Match[1]}"`,
      type: 'output',
      shape: 'parallelogram',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse paragraphs
  const pMatches = code.match(/<p[^>]*>(.+?)<\/p>/gi);
  if (pMatches && pMatches.length > 0) {
    const node = {
      id: id++,
      text: `Display ${pMatches.length} paragraph(s)`,
      type: 'output',
      shape: 'parallelogram',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Parse styles
  if (/<style/i.test(code) || /style=/i.test(code)) {
    const node = {
      id: id++,
      text: 'Apply CSS styling',
      type: 'process',
      shape: 'rectangle',
      lineNumber: 1
    };
    nodes.push(node);
    edges.push({ from: prev.id, to: node.id });
    prev = node;
  }

  // Render output
  const renderNode = {
    id: id++,
    text: 'Render webpage',
    type: 'output',
    shape: 'parallelogram',
    lineNumber: 1
  };
  nodes.push(renderNode);
  edges.push({ from: prev.id, to: renderNode.id });

  // End
  const endNode = { 
    id: id++, 
    text: 'End', 
    type: 'end',
    shape: 'terminal',
    lineNumber: 1
  };
  nodes.push(endNode);
  edges.push({ from: renderNode.id, to: endNode.id });

  return { nodes, edges };
}

export const codeTemplates = {
  python: `def check_even_odd(num):
    if num % 2 == 0:
        print("Even")
    else:
        print("Odd")

for i in range(5):
    check_even_odd(i)
`,
  javascript: `function checkEvenOdd(num) {
  if (num % 2 === 0) {
    console.log("Even");
  } else {
    console.log("Odd");
  }
}

for (let i = 0; i < 5; i++) {
  checkEvenOdd(i);
}`,
  java: `class Main {
  static void checkEvenOdd(int n) {
    if (n % 2 == 0)
      System.out.println("Even");
    else
      System.out.println("Odd");
  }
  public static void main(String[] args) {
    for (int i = 0; i < 5; i++)
      checkEvenOdd(i);
  }
}`,
  c: `#include <stdio.h>
void checkEvenOdd(int n) {
  if (n % 2 == 0)
    printf("Even\\n");
  else
    printf("Odd\\n");
}

int main() {
  for (int i = 0; i < 5; i++)
    checkEvenOdd(i);
  return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

void checkEvenOdd(int n) {
  if (n % 2 == 0)
    cout << "Even\\n";
  else
    cout << "Odd\\n";
}

int main() {
  for (int i = 0; i < 5; i++)
    checkEvenOdd(i);
  return 0;
}`,
  sql: `SELECT name, marks
FROM students
WHERE marks > 75;`,
  html: `<html>
<head><title>Hello</title></head>
<body>
<h1>Hello, World!</h1>
</body>
</html>`
};
