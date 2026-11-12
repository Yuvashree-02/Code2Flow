// src/utils/parseToGraph.js

// Move SQL parser definition to the TOP, before any other code

function parseSQLToGraph(code) {
  console.log('=== SQL PARSER CALLED ===');
  console.log('Code:', code);
  
  const nodes = [];
  const edges = [];
  let nodeId = 1;

  const createNode = (text, type = 'process') => {
    const node = { 
      id: nodeId++,
      text, 
      type, 
      shape: type === 'terminal' ? 'terminal' : type === 'decision' ? 'diamond' : type === 'io' ? 'parallelogram' : 'rectangle',
      lineNumber: 1 
    };
    nodes.push(node);
    console.log('Created node:', node);
    return node;
  };

  const createEdge = (from, to, label = '') => {
    const edge = { from: from.id, to: to.id, label };
    edges.push(edge);
    console.log('Created edge:', edge);
  };

  const startNode = createNode('Start', 'terminal');
  let prevNode = startNode;

  const upperCode = code.toUpperCase();
  console.log('Uppercase code:', upperCode);
  console.log('Contains SELECT?', upperCode.includes('SELECT'));
  
  if (upperCode.includes('SELECT')) {
    console.log('Processing SELECT query...');
    
    const connectNode = createNode('Connect to Database', 'process');
    createEdge(prevNode, connectNode);
    prevNode = connectNode;

    const selectMatch = code.match(/SELECT\s+(.*?)\s+FROM/i);
    const columns = selectMatch ? selectMatch[1].trim() : '*';
    console.log('Columns:', columns);
    const selectNode = createNode(`Select: ${columns}`, 'io');
    createEdge(prevNode, selectNode);
    prevNode = selectNode;

    const fromMatch = code.match(/FROM\s+(\w+)/i);
    const tableName = fromMatch ? fromMatch[1] : 'table';
    console.log('Table:', tableName);
    const fromNode = createNode(`From: ${tableName}`, 'process');
    createEdge(prevNode, fromNode);
    prevNode = fromNode;

    if (upperCode.includes('WHERE')) {
      console.log('Processing WHERE clause...');
      const whereMatch = code.match(/WHERE\s+(.*?)(?:ORDER|GROUP|LIMIT|;|$)/i);
      const condition = whereMatch ? whereMatch[1].trim() : 'condition';
      console.log('Condition:', condition);
      const whereNode = createNode(`Where: ${condition}?`, 'decision');
      createEdge(prevNode, whereNode);
      
      const yesNode = createNode('Include row', 'process');
      const noNode = createNode('Skip row', 'process');
      createEdge(whereNode, yesNode, 'Yes');
      createEdge(whereNode, noNode, 'No');
      
      const mergeNode = createNode('Process next row', 'process');
      createEdge(yesNode, mergeNode);
      createEdge(noNode, mergeNode);
      prevNode = mergeNode;
    }

    const returnNode = createNode('Return results', 'io');
    createEdge(prevNode, returnNode);
    prevNode = returnNode;
  }

  const endNode = createNode('End', 'terminal');
  createEdge(prevNode, endNode);

  console.log('=== SQL PARSER COMPLETE ===');
  console.log('Total nodes:', nodes.length);
  console.log('Total edges:', edges.length);
  console.log('Nodes:', JSON.stringify(nodes, null, 2));
  console.log('Edges:', JSON.stringify(edges, null, 2));

  return { nodes, edges };
}

// Define HTML parser
function parseHTMLToGraph(code) {
  const nodes = [];
  const edges = [];
  let nodeId = 1;

  const createNode = (text, type = 'process') => {
    const node = { 
      id: nodeId++,
      text, 
      type, 
      shape: type === 'terminal' ? 'terminal' : type === 'io' ? 'parallelogram' : 'rectangle',
      lineNumber: 1 
    };
    nodes.push(node);
    return node;
  };

  const createEdge = (from, to, label = '') => {
    edges.push({ from: from.id, to: to.id, label });
  };

  const startNode = createNode('Start', 'terminal');
  let prevNode = startNode;

  const receiveNode = createNode('Receive HTML', 'io');
  createEdge(prevNode, receiveNode);
  prevNode = receiveNode;

  if (code.includes('<!DOCTYPE') || code.includes('<!doctype')) {
    const doctypeNode = createNode('Parse DOCTYPE', 'process');
    createEdge(prevNode, doctypeNode);
    prevNode = doctypeNode;
  }

  if (code.includes('<html')) {
    const htmlNode = createNode('Parse <html>', 'process');
    createEdge(prevNode, htmlNode);
    prevNode = htmlNode;
  }

  if (code.includes('<head')) {
    const headNode = createNode('Process <head>', 'process');
    createEdge(prevNode, headNode);
    prevNode = headNode;

    const titleMatch = code.match(/<title>(.*?)<\/title>/i);
    if (titleMatch) {
      const titleNode = createNode(`Title: "${titleMatch[1]}"`, 'process');
      createEdge(prevNode, titleNode);
      prevNode = titleNode;
    }

    if (code.includes('<meta')) {
      const metaNode = createNode('Load metadata', 'process');
      createEdge(prevNode, metaNode);
      prevNode = metaNode;
    }

    if (code.includes('<link') || code.includes('<style')) {
      const cssNode = createNode('Load CSS', 'process');
      createEdge(prevNode, cssNode);
      prevNode = cssNode;
    }
  }

  if (code.includes('<body')) {
    const bodyNode = createNode('Process <body>', 'process');
    createEdge(prevNode, bodyNode);
    prevNode = bodyNode;

    const headerMatch = code.match(/<h[1-6]>(.*?)<\/h[1-6]>/i);
    if (headerMatch) {
      const headerNode = createNode(`Heading: "${headerMatch[1]}"`, 'io');
      createEdge(prevNode, headerNode);
      prevNode = headerNode;
    }

    if (code.includes('<p>')) {
      const pNode = createNode('Render text', 'io');
      createEdge(prevNode, pNode);
      prevNode = pNode;
    }

    if (code.includes('<div')) {
      const divNode = createNode('Create layout', 'process');
      createEdge(prevNode, divNode);
      prevNode = divNode;
    }

    if (code.includes('<img')) {
      const imgNode = createNode('Show images', 'io');
      createEdge(prevNode, imgNode);
      prevNode = imgNode;
    }
  }

  const renderNode = createNode('Render page', 'io');
  createEdge(prevNode, renderNode);
  prevNode = renderNode;

  const displayNode = createNode('Display', 'io');
  createEdge(prevNode, displayNode);
  prevNode = displayNode;

  const endNode = createNode('End', 'terminal');
  createEdge(prevNode, endNode);

  return { nodes, edges };
}

// Helper function to convert code to algorithm text
function codeToAlgorithm(line, language = 'python') {
  // Convert code statements to high-level algorithmic descriptions
  
  // Print/Output statements
  if (/print\(|console\.log\(|System\.out\.println\(|printf\(|cout\s*<</.test(line)) {
    // C printf with format specifiers
    if (/printf\(/.test(line)) {
      const printfMatch = line.match(/printf\(\s*"([^"]+)"/);
      if (printfMatch) {
        let formatStr = printfMatch[1];
        // Remove format specifiers and newlines for cleaner display
        let cleanStr = formatStr.replace(/%[diouxXeEfFgGaAcspn]/g, '').replace(/\\n/g, '').trim();
        if (cleanStr.length > 0 && cleanStr.length < 30) {
          return `Output "${cleanStr}"`;
        }
        // Check if it's just printing variables
        const varMatch = line.match(/printf\([^,]+,\s*([^)]+)\)/);
        if (varMatch) {
          const vars = varMatch[1].split(',').map(v => v.trim()).slice(0, 2).join(', ');
          return `Output ${vars}`;
        }
      }
      return 'Output result';
    }
    
    // C++ cout with endl or newline
    if (/cout\s*<</.test(line)) {
      const coutContent = line.match(/cout\s*<<\s*([^;]+)/);
      if (coutContent) {
        let content = coutContent[1].replace(/\s*<<\s*endl\s*$/, '').replace(/\s*<<\s*"\\\\n"\s*$/, '').trim();
        // Check if it's a string literal
        const stringMatch = content.match(/^["']([^"']+)["']/);
        if (stringMatch) {
          return `Output "${stringMatch[1]}"`;
        }
        // Check if it's a variable
        if (/^\w+$/.test(content)) {
          return `Output ${content}`;
        }
        // Multiple items being output
        if (content.includes('<<')) {
          return 'Output result';
        }
        return `Output ${content.substring(0, 20)}`;
      }
    }
    
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
  
  // Input statements (scanf in C, cin in C++)
  if (/scanf\(|cin\s*>>/.test(line)) {
    // C scanf
    if (/scanf\(/.test(line)) {
      const scanfMatch = line.match(/scanf\([^,]+,\s*&?([^)]+)\)/);
      if (scanfMatch) {
        // Extract variable names, removing & and * operators
        const vars = scanfMatch[1].split(',').map(v => v.trim().replace(/^[&*]+/, '')).join(', ');
        return `Input: ${vars}`;
      }
      return 'Get input';
    }
    // C++ cin
    const cinMatch = line.match(/cin\s*>>\s*([^;]+)/);
    if (cinMatch) {
      const vars = cinMatch[1].split('>>').map(v => v.trim()).join(', ');
      return `Input: ${vars}`;
    }
    return 'Get input';
  }
  
  // Function/Method definitions
  if (/^def\s+(\w+)|^function\s+(\w+)|^static\s+void\s+(\w+)|^void\s+(\w+)|^int\s+(\w+)|^double\s+(\w+)|^float\s+(\w+)|^bool\s+(\w+)/.test(line)) {
    const funcMatch = line.match(/(?:def|function|void|int|double|float|bool)\s+(\w+)\(([^)]*)\)/);
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
    // Handle C++/Java/JavaScript style: for (int i = 0; i < 5; i++) or for (int i = 0; i < n; i++)
    const cppForMatch = line.match(/for\s*\(\s*(?:int|let|var|auto)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<\s*(\w+|\d+)/);
    if (cppForMatch) {
      const start = parseInt(cppForMatch[2]);
      const end = cppForMatch[3];
      if (!isNaN(parseInt(end))) {
        const count = parseInt(end) - start;
        return `Repeat ${count} times`;
      }
      return `For ${cppForMatch[1]} = ${start} to ${end}`;
    }
    
    const cppForMatch2 = line.match(/for\s*\(\s*(?:int|let|var|auto)\s+(\w+)\s*=\s*(\d+)\s*;\s*\1\s*<=\s*(\w+|\d+)/);
    if (cppForMatch2) {
      const start = parseInt(cppForMatch2[2]);
      const end = cppForMatch2[3];
      if (!isNaN(parseInt(end))) {
        const count = parseInt(end) - start + 1;
        return `Repeat ${count} times`;
      }
      return `For ${cppForMatch2[1]} = ${start} to ${end}`;
    }
    
    // Old pattern matching for backward compatibility
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
  
  // Switch statement
  if (/^switch\s*\(/.test(line)) {
    const switchMatch = line.match(/switch\s*\(\s*(\w+)\s*\)/);
    if (switchMatch) {
      return `Check ${switchMatch[1]}`;
    }
    return 'Switch on value';
  }
  
  // Case statement
  if (/^case\s+/.test(line)) {
    const caseMatch = line.match(/case\s+([^:]+)/);
    if (caseMatch) {
      return `Case ${caseMatch[1]}`;
    }
    return 'Case';
  }
  
  // Default case
  if (/^default\s*:/.test(line)) {
    return 'Default case';
  }
  
  // Break statement
  if (/^break\s*;/.test(line)) {
    return 'Break';
  }
  
  // Continue statement
  if (/^continue\s*;/.test(line)) {
    return 'Continue';
  }
  
  // C variable declarations with initialization
  if (/^(int|float|double|char|long|short|bool|void)\s+\w+\s*=/.test(line)) {
    const declMatch = line.match(/^(int|float|double|char|long|short|bool|void)\s+(\w+)\s*=\s*([^;]+)/);
    if (declMatch) {
      const varName = declMatch[2];
      const value = declMatch[3].trim();
      if (/[\+\-\*\/]/.test(value)) {
        return `Calculate ${varName}`;
      }
      return `Set ${varName} = ${value.substring(0, 15)}`;
    }
  }
  
  // C array declaration
  if (/^(int|float|double|char)\s+\w+\[/.test(line)) {
    const arrMatch = line.match(/^(int|float|double|char)\s+(\w+)\[([^\]]+)\]/);
    if (arrMatch) {
      return `Declare array ${arrMatch[2]}`;
    }
  }
  
  // Pointer operations
  if (/\*\w+\s*=|\w+\s*=\s*&/.test(line)) {
    return 'Pointer assignment';
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

// Main parseToGraph function
export function parseToGraph(code, language = 'PYTHON') {
  if (!code || !code.trim()) {
    return { nodes: [], edges: [] };
  }

  const lang = language.toUpperCase();

  // Use specialized parsers for SQL and HTML
  if (lang === 'SQL') {
    return parseSQLToGraph(code);
  }

  if (lang === 'HTML/CSS' || lang === 'HTML') {
    return parseHTMLToGraph(code);
  }

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
      if (!t.length) return false;
      if (t.startsWith("#") || t.startsWith("//")) return false;
      if (t.startsWith("import ") || t.startsWith("using ")) return false;
      
      // Filter C/C++ specific constructs
      if (language === 'c' || language === 'cpp') {
        if (/^typedef\s+/.test(t)) return false;
        if (/^struct\s+\w+\s*\{?\s*$/.test(t)) return false;
        if (/^enum\s+\w+\s*\{?\s*$/.test(t)) return false;
        if (/^\};?\s*$/.test(t)) return false;
      }
      
      if (language === 'java' || language === 'c' || language === 'cpp' || language === 'javascript') {
        if (/^(class|public\s+class)\s+\w+\s*\{?\s*$/.test(t)) return false;
        if (/^public\s+static\s+void\s+main\s*\(/.test(t)) return false;
        if (/^int\s+main\s*\(/.test(t)) return false;
        if (/^\{\s*$/.test(t)) return false;
        if (/^\}\s*$/.test(t)) return false;
        if (/^return\s+0\s*;?\s*$/.test(t)) return false;
      }
      
      return true;
    });

  let nodes = [];
  let edges = [];
  let id = 1;

  // REMOVE these duplicate checks - they're already handled above
  // if (language === 'sql') {
  //   return parseSQLToGraph(code);
  // }
  // if (language === 'html') {
  //   return parseHTMLToGraph(code);
  // }

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

  let braceDepth = 0; // Track brace depth for C/C++/Java/JavaScript
  let loopBraceDepth = {}; // Track at what brace depth each loop started

  for (let i = 0; i < lines.length; i++) {
    const lineObj = lines[i];
    const line = lineObj.text;
    const lineNumber = lineObj.lineNumber;
    const indent = lineObj.indent;
    const original = lineObj.original;

    // Track brace depth for C-style languages
    if (language === 'java' || language === 'c' || language === 'cpp' || language === 'javascript') {
      // Count opening and closing braces in original line
      const openBraces = (original.match(/\{/g) || []).length;
      const closeBraces = (original.match(/\}/g) || []).length;
      
      // Check if we're exiting a loop
      if (closeBraces > 0 && loopStack.length > 0) {
        const currentLoopDepth = loopBraceDepth[loopStack[loopStack.length - 1].loopNode.id];
        if (braceDepth <= currentLoopDepth) {
          // Exiting the loop
          if (currentNode && currentNode !== loopStack[loopStack.length - 1].loopNode) {
            createEdge(currentNode.id, loopStack[loopStack.length - 1].loopNode.id, "Loop back");
          }
          currentNode = loopStack[loopStack.length - 1].loopNode;
          loopStack.pop();
        }
      }
      
      braceDepth += openBraces - closeBraces;
    }

    // Skip empty lines and closing braces
    if (!line || /^[\}\)]\s*$/.test(line)) continue;

    // Check if we're exiting an if/else block
    if (ifStack.length > 0) {
      const topIf = ifStack[ifStack.length - 1];
      
      // For Python: check indentation
      if (language === 'python' && indent <= topIf.indent && !line.startsWith('elif') && !line.startsWith('else') && !line.startsWith('for') && !line.startsWith('while')) {
        ifStack.pop();
      }
    }

    let node = null;

    // Function definition
    if (/^(def|function|void|int|double|float|bool|string|auto|static\s+void|public\s+static\s+void)\s+/.test(line)) {
      // Skip main method - it's just the entry point
      if (/main\s*\(/.test(line)) {
        continue;
      }
      
      const funcMatch = line.match(/\(([^)]+)\)/);
      if (funcMatch && funcMatch[1].trim()) {
        // Extract just the parameter names from various language styles
        const params = funcMatch[1].trim();
        
        // For C++/Java/C, extract variable names from "Type varName" patterns
        let paramNames = params;
        if (language === 'java' || language === 'c' || language === 'cpp') {
          const cppParams = params.split(',').map(p => {
            const parts = p.trim().split(/\s+/);
            // Handle references (&) and pointers (*) in C++
            let varName = parts.length > 1 ? parts[parts.length - 1] : parts[0];
            varName = varName.replace(/^[&*]+/, ''); // Remove & or * prefix
            return varName;
          }).join(', ');
          paramNames = cppParams;
        }
        
        node = createNode(`Parameters: ${paramNames}`, 'input', 'parallelogram', lineNumber);
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
      
      let label = "";
      // Check if we're in an else block
      if (ifStack.length > 0) {
        const topIf = ifStack[ifStack.length - 1];
        if (topIf.hasElse && !topIf.noNode) {
          label = "No";
          topIf.noNode = node;
        }
        // Clear ifStack since we're now in the loop
        ifStack = [];
      }
      
      // Connect from all pending if/else nodes if they exist
      if (afterIfNodes.length > 0) {
        // Connect all branch nodes to this loop
        afterIfNodes.forEach(afterNode => {
          createEdge(afterNode.id, node.id, "");
        });
        afterIfNodes = [];
      } else {
        createEdge(currentNode.id, node.id, label);
      }
      
      loopStack.push({
        loopNode: node,
        indent: indent
      });
      
      // Track brace depth for this loop
      if (language === 'java' || language === 'c' || language === 'cpp' || language === 'javascript') {
        loopBraceDepth[node.id] = braceDepth;
      }
      
      currentNode = node;
    }
    
    // Input statement (scanf in C, cin in C++)
    else if (/scanf\(|cin\s*>>/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'input', 'parallelogram', lineNumber);
      
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
    
    // Switch statement
    else if (/^switch\s*\(/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'decision', 'diamond', lineNumber);
      createEdge(currentNode.id, node.id);
      currentNode = node;
    }
    
    // Case statement
    else if (/^case\s+/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'decision', 'diamond', lineNumber);
      createEdge(currentNode.id, node.id);
      currentNode = node;
    }
    
    // Default case
    else if (/^default\s*:/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'process', 'rectangle', lineNumber);
      createEdge(currentNode.id, node.id);
      currentNode = node;
    }
    
    // Break/Continue statements
    else if (/^(break|continue)\s*;/.test(line)) {
      const algorithmText = codeToAlgorithm(line, language);
      node = createNode(algorithmText, 'process', 'rectangle', lineNumber);
      createEdge(currentNode.id, node.id);
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
    else if (/(\w+)\([^)]*\)/.test(line) && !/^(if|for|while|elif|print|console|println|switch|case)/.test(line)) {
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
          afterIfNodes.push(node);
        } else if (topIf.hasElse && !topIf.noNode) {
          label = "No";
          topIf.noNode = node;
          afterIfNodes.push(node);
        }
      } else if (loopStack.length > 0 && currentNode.type === 'loop') {
        label = "Yes";
      }
      
      createEdge(currentNode.id, node.id, label);
      currentNode = node;
    }
  }

  // Handle loop back edges (for any remaining loops that didn't close)
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
  } else if (afterIfNodes.length > 0) {
    // Connect all branch end nodes to the end
    afterIfNodes.forEach(afterNode => {
      createEdge(afterNode.id, endNode.id);
    });
  } else if (currentNode) {
    createEdge(currentNode.id, endNode.id);
  }

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

int main() {
  int num, sum = 0;
  
  printf("Enter a number: ");
  scanf("%d", &num);
  
  if (num < 0) {
    printf("Negative number\\n");
  } else {
    for (int i = 1; i <= num; i++) {
      sum = sum + i;
    }
    printf("Sum = %d\\n", sum);
  }
  
  return 0;
}`,
  cpp: `#include <iostream>
using namespace std;

void checkEvenOdd(int n) {
  if (n % 2 == 0)
    cout << "Even" << endl;
  else
    cout << "Odd" << endl;
}

int main() {
  int num;
  cout << "Enter a number: ";
  cin >> num;
  checkEvenOdd(num);
  
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
