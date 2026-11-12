import React, { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'react-router-dom';
import SvgFlow from '../components/SvgFlow';
import { parseToGraph, codeTemplates } from '../utils/parseToGraph';

function Editor() {
  const [searchParams] = useSearchParams();
  const [code, setCode] = useState('');
  const [lang, setLang] = useState('python');
  const [graph, setGraph] = useState(null);
  const [message, setMessage] = useState('');
  const [highlightedLine, setHighlightedLine] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);
  const textareaRef = useRef(null);
  const svgRef = useRef(null);

  useEffect(() => {
    const langParam = searchParams.get('lang');
    if (langParam && codeTemplates[langParam]) {
      setLang(langParam);
      setCode(codeTemplates[langParam]);
    } else {
      // Load saved code from localStorage
      const savedCode = localStorage.getItem('code2flow_code');
      const savedLang = localStorage.getItem('code2flow_lang');
      if (savedCode) setCode(savedCode);
      if (savedLang) setLang(savedLang);
    }
  }, [searchParams]);

  // Auto-save code to localStorage
  useEffect(() => {
    if (code) {
      const timer = setTimeout(() => {
        localStorage.setItem('code2flow_code', code);
        localStorage.setItem('code2flow_lang', lang);
      }, 1000); // Save after 1 second of no typing
      return () => clearTimeout(timer);
    }
  }, [code, lang]);

  const handleExportImage = () => {
    const svgElement = document.querySelector('#flowchart-svg');
    if (!svgElement) {
      alert('No flowchart to export. Generate a flowchart first!');
      return;
    }

    // Create a canvas and convert SVG to PNG
    const svgData = new XMLSerializer().serializeToString(svgElement);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    const svgBlob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' });
    const url = URL.createObjectURL(svgBlob);

    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx.fillStyle = 'white';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 0, 0);
      
      canvas.toBlob((blob) => {
        const link = document.createElement('a');
        link.download = `flowchart_${Date.now()}.png`;
        link.href = URL.createObjectURL(blob);
        link.click();
        URL.revokeObjectURL(url);
      });
    };

    img.src = url;
  };

  const handleClearCode = () => {
    if (window.confirm('Are you sure you want to clear the code?')) {
      setCode('');
      setGraph(null);
      setMessage('');
      setSelectedNode(null);
      localStorage.removeItem('code2flow_code');
    }
  };

  const handleGenerate = () => {
    if (!code.trim()) {
      setMessage('Please enter some code to generate a flowchart.');
      setGraph(null);
      return;
    }
    
    // Validate if code matches selected language
    const isValidLanguage = validateLanguage(code, lang);
    if (!isValidLanguage) {
      setMessage(`The code you entered doesn't match the selected language (${lang.toUpperCase()}). Please select the correct language or update your code.`);
      setGraph(null);
      return;
    }
    
    // FIX: Pass the language parameter!
    console.log('Calling parseToGraph with language:', lang);
    const g = parseToGraph(code, lang);  // <--- ADD lang HERE!
    console.log('Result:', g);
    setGraph(g);
    setMessage('');
  };

  const validateLanguage = (code, selectedLang) => {
    const trimmedCode = code.trim();
    const lowerCode = code.toLowerCase();
    
    switch(selectedLang) {
      case 'python':
        // Check for Python-specific syntax
        const hasPythonSyntax = /def\s+\w+|class\s+\w+|import\s+\w+|from\s+\w+\s+import|for\s+\w+\s+in\s+|if\s+.*:|elif\s+.*:|while\s+.*:|print\(|range\(/.test(trimmedCode);
        const hasNonPythonSyntax = /\bfunction\b|\bconst\b|\blet\b|\bvar\b|console\.log|#include|System\.out\.println|<html|SELECT\s+.*\s+FROM/i.test(trimmedCode);
        return hasPythonSyntax && !hasNonPythonSyntax;
      
      case 'javascript':
        // Check for JavaScript-specific syntax
        const hasJSSyntax = /function\s+\w+|const\s+\w+|let\s+\w+|var\s+\w+|console\.log|=>|\.forEach|\.map|\.filter/.test(trimmedCode);
        const hasNonJSSyntax = /^def\s+\w+|#include|System\.out\.println|<html|SELECT\s+.*\s+FROM/i.test(trimmedCode);
        return hasJSSyntax && !hasNonJSSyntax;
      
      case 'java':
        // Check for Java-specific syntax
        const hasJavaSyntax = /class\s+\w+|public\s+(static\s+)?void|private\s+|protected\s+|System\.out\.println|import\s+java|public\s+class/.test(trimmedCode);
        const hasNonJavaSyntax = /^def\s+\w+|#include|console\.log|<html|SELECT\s+.*\s+FROM|cout\s*<</i.test(trimmedCode);
        return hasJavaSyntax && !hasNonJavaSyntax;
      
      case 'c':
        // Check for C-specific syntax
        const hasCSyntax = /#include\s*<|int\s+main|printf\(|scanf\(|void\s+\w+\(|return\s+0;|stdio\.h/.test(trimmedCode);
        const hasNonCSyntax = /^def\s+\w+|console\.log|System\.out\.println|<html|SELECT\s+.*\s+FROM|cout\s*<<|using\s+namespace/i.test(trimmedCode);
        return hasCSyntax && !hasNonCSyntax;
      
      case 'cpp':
        // Check for C++-specific syntax
        const hasCppSyntax = /#include\s*<|using\s+namespace|cout\s*<<|cin\s*>>|std::|iostream|int\s+main/.test(trimmedCode);
        const hasNonCppSyntax = /^def\s+\w+|console\.log|System\.out\.println|<html|SELECT\s+.*\s+FROM|printf\(/i.test(trimmedCode);
        return hasCppSyntax && !hasNonCppSyntax;
      
      case 'sql':
        // Check for SQL-specific syntax
        const hasSQLSyntax = /\b(SELECT|INSERT|UPDATE|DELETE|FROM|WHERE|CREATE|DROP|ALTER|TABLE|DATABASE|JOIN|GROUP\s+BY|ORDER\s+BY)\b/i.test(trimmedCode);
        const hasNonSQLSyntax = /^def\s+\w+|function\s+\w+|#include|System\.out\.println|<html|console\.log|cout\s*<</i.test(trimmedCode);
        return hasSQLSyntax && !hasNonSQLSyntax;
      
      case 'html':
        // Check for HTML-specific syntax
        const hasHTMLSyntax = /<(!DOCTYPE\s+)?html|<head|<body|<div|<p|<h[1-6]|<style|<script|<title|<meta/i.test(trimmedCode);
        const hasNonHTMLSyntax = /^def\s+\w+|function\s+\w+(?!\s*\()|#include|System\.out\.println|SELECT\s+.*\s+FROM|console\.log(?!.*<)/i.test(trimmedCode);
        return hasHTMLSyntax && !hasNonHTMLSyntax;
      
      default:
        return true;
    }
  };

  const handleNodeClick = (lineNumber, node) => {
    if (!textareaRef.current) return;
    
    // Set the highlighted line
    setHighlightedLine(lineNumber);
    
    // Set the selected node for explanation
    setSelectedNode(node);
    
    // Scroll to the line in the textarea
    const lines = code.split('\n');
    const linesBefore = lines.slice(0, lineNumber - 1).join('\n');
    const charPosition = linesBefore.length + (lineNumber > 1 ? 1 : 0);
    
    // Move cursor to the line
    textareaRef.current.focus();
    textareaRef.current.setSelectionRange(charPosition, charPosition + lines[lineNumber - 1]?.length || 0);
    
    // Clear highlight after 2 seconds
    setTimeout(() => {
      setHighlightedLine(null);
    }, 2000);
  };

  const getNodeExplanation = (node) => {
    if (!node) return '';
    
    const nodeType = node.type || node.shape;
    const nodeText = (node.text || node.label || '').toLowerCase();
    
    // Get all nodes up to current node to understand context
    const nodeIndex = graph?.nodes?.findIndex(n => n.id === node.id) || 0;
    const previousNodes = graph?.nodes?.slice(0, nodeIndex) || [];
    const hasInput = previousNodes.some(n => n.type === 'input');
    const hasDecision = previousNodes.some(n => n.type === 'decision');
    const hasLoop = previousNodes.some(n => n.type === 'loop');
    
    let explanation = '';
    
    // Check if this is the End node
    if (nodeText.includes('end')) {
      // Generate summary of what the program did
      explanation = '🔴 **End of Program**\n\n';
      
      // Analyze the actual code to create a meaningful summary
      if (code && graph && graph.nodes) {
        const codeLines = code.toLowerCase();
        
        // Provide a natural language explanation based on code patterns
        if (codeLines.includes('even') && codeLines.includes('odd')) {
          explanation += '**What this program does:**\n\nThis program helps you find out if a number is even or odd.\n\nFirst, it creates a function that takes any number you give it. Then it divides that number by 2. If there\'s no remainder (the division is exact), it tells you the number is "Even". If there\'s a remainder left over, it tells you the number is "Odd".\n\nFinally, it tests this function by running it 5 times with different numbers to show you how it works!';
        } else if ((codeLines.includes('sum') || codeLines.includes('total') || codeLines.includes('add')) && codeLines.includes('loop')) {
          explanation += '**What this program does:**\n\nThis program adds up a series of numbers.\n\nIt starts with zero and then keeps adding numbers one by one in a loop. Each time through the loop, it adds the next number to the running total. When the loop finishes, it shows you the final sum of all the numbers.';
        } else if (codeLines.includes('factorial')) {
          explanation += '**What this program does:**\n\nThis program calculates the factorial of a number.\n\nIt takes a number and multiplies it by every smaller positive number down to 1. For example, factorial of 5 is 5 × 4 × 3 × 2 × 1 = 120. It uses a loop to do this multiplication step by step.';
        } else if (codeLines.includes('fibonacci')) {
          explanation += '**What this program does:**\n\nThis program generates the Fibonacci sequence.\n\nIt starts with 0 and 1, then keeps adding the last two numbers to get the next one. So you get: 0, 1, 1, 2, 3, 5, 8, and so on. The program repeats this process to create as many Fibonacci numbers as you want.';
        } else if (codeLines.includes('prime')) {
          explanation += '**What this program does:**\n\nThis program checks if a number is prime.\n\nA prime number can only be divided evenly by 1 and itself. The program tests this by trying to divide the number by other numbers. If none of them divide evenly, it\'s prime! Otherwise, it\'s not.';
        } else if (codeLines.includes('sort') || codeLines.includes('bubble') || codeLines.includes('arrange')) {
          explanation += '**What this program does:**\n\nThis program sorts a list of items in order.\n\nIt compares items two at a time and swaps them if they\'re in the wrong order. It keeps doing this over and over until everything is arranged correctly, from smallest to largest (or alphabetically).';
        } else if (codeLines.includes('search') || codeLines.includes('find')) {
          explanation += '**What this program does:**\n\nThis program searches for a specific item in a list.\n\nIt goes through the list one item at a time, comparing each one with what you\'re looking for. When it finds a match, it tells you where it found it. If it doesn\'t find it anywhere, it lets you know it\'s not in the list.';
        } else if (codeLines.includes('reverse')) {
          explanation += '**What this program does:**\n\nThis program reverses something.\n\nIt takes the items (could be letters in a word or numbers in a list) and flips their order completely. The first becomes last, the last becomes first, and everything in between gets flipped around too.';
        } else if (codeLines.includes('max') || codeLines.includes('min') || codeLines.includes('largest') || codeLines.includes('smallest')) {
          explanation += '**What this program does:**\n\nThis program finds the biggest or smallest number in a group.\n\nIt starts by assuming the first number is the biggest (or smallest), then checks all the other numbers one by one. Whenever it finds a bigger (or smaller) one, it remembers that instead. At the end, it tells you which number was the winner!';
        } else if (codeLines.includes('average') || codeLines.includes('mean')) {
          explanation += '**What this program does:**\n\nThis program calculates the average of a group of numbers.\n\nIt adds all the numbers together to get the total sum, then divides that sum by how many numbers there were. This gives you the "middle" value - the average!';
        } else {
          // Generic explanation based on structure
          const hasLoop = graph.nodes.some(n => n.type === 'loop');
          const hasDecision = graph.nodes.some(n => n.type === 'decision');
          const hasOutput = graph.nodes.some(n => n.type === 'output');
          
          explanation += '**What this program does:**\n\n';
          
          if (hasLoop && hasDecision) {
            explanation += 'This program processes information by repeating steps multiple times. During each repetition, it checks certain conditions to decide what to do. Based on these decisions, it performs different actions and shows you the results.';
          } else if (hasDecision) {
            explanation += 'This program makes decisions based on the information it receives. It checks if certain conditions are true or false, then does different things depending on the result. Finally, it shows you the outcome.';
          } else if (hasLoop) {
            explanation += 'This program repeats a task several times. Each time it goes through the loop, it does the same set of actions with possibly different data. When it\'s done repeating, it shows you the results.';
          } else if (hasOutput) {
            explanation += 'This program takes some input, processes it step by step following specific instructions, and then displays the final result to you.';
          } else {
            explanation += 'This program follows a series of steps to process data and complete its task.';
          }
        }
      } else {
        explanation += '**What this program does:**\n\nThe program has successfully completed all its tasks!';
      }
      
      if (node.lineNumber) {
        explanation += `\n\n📍 **Line ${node.lineNumber}** in your code`;
      }
      
      return explanation;
    }
    
    // Check if this is the Start node
    if (nodeText.includes('start')) {
      explanation = '🟢 **Start of Program**\n\nThis is where the program begins running.\n\nAll the steps below this will happen one by one.';
      
      if (node.lineNumber) {
        explanation += `\n\n📍 **Line ${node.lineNumber}** in your code`;
      }
      
      return explanation;
    }
    
    // Handle other node types
    switch(nodeType) {
      case 'input':
        const inputText = node.text || node.label || '';
        explanation = `🔵 **Getting Information**\n\n`;
        
        // Analyze what kind of input this is
        if (inputText.toLowerCase().includes('param') || inputText.toLowerCase().includes('argument') || inputText.toLowerCase().includes('num')) {
          explanation += `**What's happening:** The function is receiving data (called "parameters") from whoever called it.\n\n`;
          explanation += `**Parameters:** ${inputText}\n\n`;
          explanation += `💡 **Think of it like this:** When you order a pizza, you give the restaurant your preferences (pepperoni, large size, thin crust). Similarly, this function receives the information it needs as parameters.\n\n`;
          
          if (inputText.toLowerCase().includes('num')) {
            explanation += `In this case, **num** is the number being passed in. Let's say someone calls this function with the number 7.\n\n`;
            explanation += `That value (7) will now flow through all the steps below:\n`;
            explanation += `→ First, it will be checked if it's even or odd\n`;
            explanation += `→ Then, the result will be displayed\n\n`;
          }
          
          explanation += `These input values are essential - they're what the function needs to do its job and produce a result.`;
          
        } else if (inputText.toLowerCase().includes('input') || inputText.toLowerCase().includes('read')) {
          explanation += `**What's happening:** The program is pausing and waiting for YOU to type something.\n\n`;
          explanation += `💡 **Real-world example:** Like when an ATM asks "Enter your PIN" and waits for you to type numbers.\n\n`;
          explanation += `**What it needs:** ${inputText}\n\n`;
          explanation += `Whatever you type will be saved and used in the next steps. The program can't continue until you provide this information!`;
          
        } else if (inputText.toLowerCase().includes('file') || inputText.toLowerCase().includes('open')) {
          explanation += `**What's happening:** The program is opening and reading a file from your computer.\n\n`;
          explanation += `**Action:** ${inputText}\n\n`;
          explanation += `💡 **Think of it like this:** Just like opening a Word document to read what's inside, this program is loading data from a file so it can work with it.`;
          
        } else {
          explanation += `**What's happening:** The program is gathering the data it needs to start working.\n\n`;
          explanation += `**Details:** ${inputText}\n\n`;
          explanation += `This information could come from:\n`;
          explanation += `• The user typing something in\n`;
          explanation += `• Another part of the program passing data\n`;
          explanation += `• A starting value the program sets itself\n\n`;
          explanation += `All the steps that follow will use this data to produce the final result.`;
        }
        break;
      
      case 'output':
        const outputText = node.text || node.label || '';
        explanation = `📤 **Showing the Result**\n\n`;
        
        // Analyze what's being output and connect to previous steps
        if (outputText.toLowerCase().includes('return')) {
          explanation += `**What's happening:** The function has finished its work and is sending back the answer.\n\n`;
          explanation += `**Returns:** ${outputText}\n\n`;
          
          if (hasDecision) {
            explanation += `💡 **How we got here:** Based on the decision made in the diamond above, the function figured out the right answer and now it's returning that value.\n\n`;
          }
          explanation += `**Think of it like this:** When you use a calculator and press "=", you get the answer. That's what "return" does - it gives back the final result so whoever called this function can use it!`;
          
        } else if (outputText.toLowerCase().includes('print') || outputText.toLowerCase().includes('display')) {
          explanation += `**What's happening:** The program is showing a message on your screen.\n\n`;
          explanation += `**Message:** ${outputText}\n\n`;
          
          // Check if this is after a decision
          if (hasDecision) {
            const codeLines = code.toLowerCase();
            
            if (outputText.toLowerCase().includes('even')) {
              explanation += `🎯 **Why does it print "Even"?**\n\n`;
              explanation += `Let's trace back:\n`;
              explanation += `1️⃣ In the diamond decision above, we checked: "Does this number divide evenly by 2?"\n`;
              explanation += `2️⃣ The answer was **YES** (the condition was TRUE)\n`;
              explanation += `3️⃣ So we followed the "Yes" arrow and arrived here!\n\n`;
              explanation += `💡 **Example:** If the number is 8:\n`;
              explanation += `• 8 ÷ 2 = 4 with **NO remainder**\n`;
              explanation += `• So 8 % 2 = 0 (the % symbol gives us the remainder)\n`;
              explanation += `• That means it's an EVEN number!`;
            } else if (outputText.toLowerCase().includes('odd')) {
              explanation += `🎯 **Why does it print "Odd"?**\n\n`;
              explanation += `Let's trace back:\n`;
              explanation += `1️⃣ In the diamond decision above, we checked: "Does this number divide evenly by 2?"\n`;
              explanation += `2️⃣ The answer was **NO** (the condition was FALSE)\n`;
              explanation += `3️⃣ So we followed the "No" arrow and arrived here!\n\n`;
              explanation += `💡 **Example:** If the number is 7:\n`;
              explanation += `• 7 ÷ 2 = 3 with **remainder 1**\n`;
              explanation += `• So 7 % 2 = 1 (the % symbol gives us the remainder)\n`;
              explanation += `• That means it's an ODD number!`;
            } else {
              explanation += `💡 **How we got here:** The program made a decision earlier (in the diamond shape), then followed one specific path to reach this print statement. What you see on screen depends on which path was taken!`;
            }
          } else if (hasInput) {
            explanation += `💡 **The journey:** The program took the input it received at the start, processed it through all the steps, and now it's showing you the final answer. This is the program's way of talking to you!`;
          } else {
            explanation += `💡 **Simple:** Whatever text is in this print statement will appear on your screen when the program runs. It's how the program communicates with you!`;
          }
          
        } else if (outputText.toLowerCase().includes('write') || outputText.toLowerCase().includes('save')) {
          explanation += `**What's happening:** The program is saving information to a file.\n\n`;
          explanation += `**Action:** ${outputText}\n\n`;
          
          if (hasDecision || hasLoop) {
            explanation += `💡 **Why save it?** After doing all the calculations, decisions, and loops above, the program has valuable results. Saving them to a file means you can access this information later, even after the program closes!\n\n`;
          }
          explanation += `**Think of it like this:** It's like taking a photo of your work and saving it - the information stays safe even after you turn off your computer.`;
          
        } else {
          explanation += `**What's happening:** The program is sending out information.\n\n`;
          explanation += `**Details:** ${outputText}\n\n`;
          
          if (hasDecision) {
            explanation += `💡 **Path taken:** Different decisions earlier led to different results. This is the output for the specific path the program followed.\n\n`;
          }
          explanation += `This information might be shown to you, sent to another program, or returned as a final answer.`;
        }
        break;
      
      case 'decision':
      case 'condition':
        const conditionText = node.text || node.label || '';
        explanation = `💎 **Decision Point - Where the Code Chooses a Path**\n\n`;
        
        // Analyze the condition and provide context
        if (conditionText.includes('%') || conditionText.toLowerCase().includes('mod')) {
          explanation += `**The Question Being Asked:** ${conditionText}\n\n`;
          
          if (hasInput) {
            explanation += `Remember that number we received earlier? Now we're checking if it's even or odd!\n\n`;
          }
          
          explanation += `🔍 **Understanding the % (Modulo) Operator:**\n\n`;
          explanation += `The % symbol gives you the **remainder** after division.\n\n`;
          explanation += `**Let's see it in action:**\n\n`;
          explanation += `📊 **Even Numbers (No Remainder):**\n`;
          explanation += `• 10 ÷ 2 = 5 remainder **0** → 10 % 2 = 0 ✅ EVEN\n`;
          explanation += `• 24 ÷ 2 = 12 remainder **0** → 24 % 2 = 0 ✅ EVEN\n\n`;
          explanation += `📊 **Odd Numbers (Has Remainder):**\n`;
          explanation += `• 11 ÷ 2 = 5 remainder **1** → 11 % 2 = 1 ❌ ODD\n`;
          explanation += `• 17 ÷ 2 = 8 remainder **1** → 17 % 2 = 1 ❌ ODD\n\n`;
          explanation += `🚦 **What Happens Next:**\n`;
          explanation += `✅ **If TRUE (remainder = 0):** The number is EVEN, follow the "Yes" arrow\n`;
          explanation += `❌ **If FALSE (remainder ≠ 0):** The number is ODD, follow the "No" arrow`;
          
        } else if (conditionText.includes('>') || conditionText.includes('<') || conditionText.includes('greater') || conditionText.includes('less')) {
          explanation += `**The Question Being Asked:** ${conditionText}\n\n`;
          
          if (hasInput) {
            explanation += `Using the value we got earlier, the program now compares it with another number.\n\n`;
          }
          
          explanation += `🔍 **What's a Comparison?**\n\n`;
          explanation += `The program is checking which number is bigger or smaller.\n\n`;
          explanation += `💡 **Real-world example:** Like checking if you're tall enough to ride a rollercoaster (must be > 48 inches), or if you qualify for a senior discount (must be > 65 years old).\n\n`;
          explanation += `🚦 **What Happens Next:**\n`;
          explanation += `✅ **If TRUE:** The comparison is correct, follow the "Yes" path\n`;
          explanation += `❌ **If FALSE:** The comparison is wrong, follow the "No" path`;
          
        } else if (conditionText.includes('==') || conditionText.toLowerCase().includes('equal')) {
          explanation += `**The Question Being Asked:** ${conditionText}\n\n`;
          
          if (hasInput) {
            explanation += `The program is checking if the input matches a specific value.\n\n`;
          }
          
          explanation += `🔍 **Checking for Equality:**\n\n`;
          explanation += `The program is asking "Are these two things exactly the same?"\n\n`;
          explanation += `💡 **Real-world example:** Like checking if the password you typed matches the saved password (must be exactly the same, even capital letters matter!).\n\n`;
          explanation += `🚦 **What Happens Next:**\n`;
          explanation += `✅ **If TRUE:** They match perfectly!\n`;
          explanation += `❌ **If FALSE:** They're different`;
          
        } else if (conditionText.toLowerCase().includes('empty') || conditionText.toLowerCase().includes('null') || conditionText.toLowerCase().includes('none')) {
          explanation += `**The Question Being Asked:** ${conditionText}\n\n`;
          explanation += `🔍 **Checking if Empty:**\n\n`;
          explanation += `The program is checking if a variable has nothing in it.\n\n`;
          explanation += `💡 **Real-world example:** Like checking if a box is empty before you try to take something out of it.\n\n`;
          explanation += `🚦 **What Happens Next:**\n`;
          explanation += `✅ **If TRUE:** It's empty/null, handle accordingly\n`;
          explanation += `❌ **If FALSE:** There's a value, use it!`;
          
        } else {
          explanation += `**The Question Being Asked:** ${conditionText}\n\n`;
          
          if (hasInput) {
            explanation += `Using the data from earlier, the program now makes a critical decision.\n\n`;
          }
          
          explanation += `🔍 **What's a Decision Point?**\n\n`;
          explanation += `This diamond shape represents a **TRUE or FALSE question**. The program evaluates the condition and gets either YES or NO as the answer.\n\n`;
          explanation += `💡 **Think of it like this:** You're at a fork in the road. Depending on the answer to the question, you'll take one path or the other. You can't take both!\n\n`;
          explanation += `🚦 **What Happens Next:**\n`;
          explanation += `✅ **If TRUE (Yes):** Follow the "Yes" arrow → Do one set of actions\n`;
          explanation += `❌ **If FALSE (No):** Follow the "No" arrow → Do a different set of actions`;
        }
        break;
      
      case 'loop':
        const loopText = node.text || node.label || '';
        explanation = `🔁 **Loop - Repeating Actions**\n\n`;
        
        // Analyze the loop type and provide context
        if (loopText.toLowerCase().includes('for') || loopText.toLowerCase().includes('range')) {
          explanation += `**Loop Type:** FOR loop (Counted repetition)\n**Details:** ${loopText}\n\n`;
          
          if (hasDecision || hasInput) {
            explanation += `💡 **Why the loop?** Now that we've set up our function with all its logic above, this loop will test it multiple times with different values!\n\n`;
          }
          
          explanation += `🔄 **How FOR Loops Work:**\n\n`;
          explanation += `A FOR loop is like saying: "Do this exact task X number of times"\n\n`;
          explanation += `**Real-world example:** If you need to send birthday cards to 5 friends, you repeat the same steps (write card, address envelope, add stamp, mail it) 5 times - once for each friend.\n\n`;
          explanation += `📊 **In this code:**\n`;
          
          if (code.toLowerCase().includes('check_even_odd') || code.toLowerCase().includes('range(5)')) {
            explanation += `The loop runs 5 times, using numbers 0, 1, 2, 3, and 4. Each time, it calls the function above to check if that number is even or odd!\n\n`;
            explanation += `**What you'll see:**\n`;
            explanation += `• Round 1: Check if 0 is even or odd\n`;
            explanation += `• Round 2: Check if 1 is even or odd\n`;
            explanation += `• Round 3: Check if 2 is even or odd\n`;
            explanation += `• Round 4: Check if 3 is even or odd\n`;
            explanation += `• Round 5: Check if 4 is even or odd\n`;
            explanation += `• Then STOP and move on!`;
          } else {
            explanation += `Each time through the loop, the program does the exact same steps but might use different values. When it finishes all repetitions, it moves to the next part of the program.`;
          }
          
        } else if (loopText.toLowerCase().includes('while')) {
          explanation += `**Loop Type:** WHILE loop (Condition-based repetition)\n**Details:** ${loopText}\n\n`;
          
          if (hasDecision) {
            explanation += `This loop will keep repeating as long as a condition stays true, making decisions each time through.\n\n`;
          }
          
          explanation += `🔄 **How WHILE Loops Work:**\n\n`;
          explanation += `A WHILE loop is like saying: "Keep doing this UNTIL something changes"\n\n`;
          explanation += `**Real-world example:** \n`;
          explanation += `• "Keep adding sugar to your coffee WHILE it's still bitter"\n`;
          explanation += `• "Keep driving WHILE you haven't reached your destination"\n`;
          explanation += `• "Keep waiting WHILE the download is still in progress"\n\n`;
          explanation += `📊 **Important:** Before EACH repetition, it checks: "Is the condition still true?"\n`;
          explanation += `• ✅ **If YES:** Do the loop body again\n`;
          explanation += `• ❌ **If NO:** Exit the loop and move on\n\n`;
          explanation += `⚠️ **Warning:** Make sure something in the loop changes so the condition eventually becomes false, otherwise it will loop forever!`;
          
        } else if (loopText.toLowerCase().includes('each') || loopText.toLowerCase().includes('in')) {
          explanation += `**Loop Type:** FOR-EACH loop (Process each item)\n**Details:** ${loopText}\n\n`;
          
          if (hasInput) {
            explanation += `This loop will process every piece of data that was received earlier, one at a time.\n\n`;
          }
          
          explanation += `🔄 **How FOR-EACH Loops Work:**\n\n`;
          explanation += `A FOR-EACH loop is like saying: "Do this for every item in my collection"\n\n`;
          explanation += `**Real-world examples:**\n`;
          explanation += `• Going through each photo in your camera roll\n`;
          explanation += `• Reading each name on a guest list\n`;
          explanation += `• Checking each item in your shopping cart\n\n`;
          explanation += `📊 **The process:**\n`;
          explanation += `1. Start with the first item\n`;
          explanation += `2. Do all the steps for that item\n`;
          explanation += `3. Move to the next item\n`;
          explanation += `4. Repeat until you've processed every single item\n`;
          explanation += `5. Done!\n\n`;
          explanation += `💡 **Convenient:** You don't need to count or keep track - the loop automatically handles going from one item to the next!`;
          
        } else {
          explanation += `**Loop Details:** ${loopText}\n\n`;
          
          if (hasDecision) {
            explanation += `This loop will repeatedly run the decision-making code inside it.\n\n`;
          }
          
          explanation += `🔄 **What's a Loop?**\n\n`;
          explanation += `A loop makes the program repeat the same steps over and over. Instead of writing the same code 100 times, you write it once and loop it 100 times!\n\n`;
          explanation += `**Real-world example:** Imagine doing jumping jacks. You don't do just one - you repeat the same motion multiple times. That's what a loop does for code!\n\n`;
          explanation += `📊 **The process:**\n`;
          explanation += `1. Check the loop condition (Can we continue?)\n`;
          explanation += `2. If YES → Do all the steps inside the loop\n`;
          explanation += `3. Go back to step 1 and check again\n`;
          explanation += `4. If NO → Exit the loop and continue with the rest of the program`;
        }
        break;
      
      case 'process':
      case 'rectangle':
        const text = (node.text || node.label || '').toLowerCase();
        const originalText = node.text || node.label || '';
        
        if (text.includes('calculate') || text.includes('compute') || text.includes('*') || text.includes('+') || text.includes('-') || text.includes('/')) {
          explanation = `⚙️ **Doing Math / Calculation**\n\n**Action:** ${originalText}\n\n`;
          explanation += `🔢 **What's happening:**\n`;
          explanation += `The program is performing a mathematical calculation and storing the result.\n\n`;
          explanation += `💡 **Real-world example:**\n`;
          explanation += `• Calculating a restaurant bill: meal price + tax + tip\n`;
          explanation += `• Finding area of a room: length × width\n`;
          explanation += `• Computing your age: current year - birth year\n\n`;
          explanation += `The calculated value gets saved in a variable (like a labeled container) so the program can use it in the next steps.`;
        } else if (text.includes('assign') || text.includes('set') || text.includes('=') && !text.includes('==')) {
          explanation = `📝 **Storing a Value**\n\n**Action:** ${originalText}\n\n`;
          explanation += `💾 **What's happening:**\n`;
          explanation += `The program is putting a value into a variable (a named storage location).\n\n`;
          explanation += `💡 **Think of variables like labeled boxes:**\n`;
          explanation += `• The variable name is the label on the box (e.g., "age", "total", "username")\n`;
          explanation += `• The value is what you put inside the box (e.g., 25, 100, "John")\n`;
          explanation += `• Later, when you need that value, you just look at the label to find the right box!\n\n`;
          explanation += `**Why store values?** So we can remember and reuse them throughout the program without having to recalculate or re-enter them.`;
        } else if (text.includes('call') || text.includes('function') || text.includes('()')) {
          explanation = `📞 **Calling a Function**\n\n**Action:** ${originalText}\n\n`;
          explanation += `🎯 **What's happening:**\n`;
          explanation += `The program is jumping to run a separate block of code (a function), then coming back here when done.\n\n`;
          explanation += `💡 **Real-world analogy:**\n`;
          explanation += `Imagine you're following a recipe that says "Make the sauce (see page 45)". You:\n`;
          explanation += `1. Flip to page 45 and follow those instructions\n`;
          explanation += `2. When done, return to your original page\n`;
          explanation += `3. Continue with the next step\n\n`;
          explanation += `**Benefits of functions:**\n`;
          explanation += `• Write code once, use it many times\n`;
          explanation += `• Makes programs organized and easier to understand\n`;
          explanation += `• Each function does one specific job`;
        } else if (text.includes('increment') || text.includes('++') || text.includes('+=')) {
          explanation = `📈 **Increasing a Value**\n\n**Action:** ${originalText}\n\n`;
          explanation += `➕ **What's happening:**\n`;
          explanation += `The program is adding to a variable's current value.\n\n`;
          explanation += `💡 **Real-world examples:**\n`;
          explanation += `• Counting visitors: every time someone enters, add 1 to the count\n`;
          explanation += `• Building a total: keep adding prices as you scan items\n`;
          explanation += `• Tracking score: add points each time the player wins\n\n`;
          explanation += `**Common uses:**\n`;
          explanation += `• Loop counters (i = i + 1 or i++)\n`;
          explanation += `• Running totals (sum = sum + newValue)\n`;
          explanation += `• Progress tracking`;
        } else if (text.includes('append') || text.includes('push') || text.includes('add')) {
          explanation = `➕ **Adding to a List**\n\n**Action:** ${originalText}\n\n`;
          explanation += `📋 **What's happening:**\n`;
          explanation += `The program is adding a new item to the end of a list or collection.\n\n`;
          explanation += `💡 **Real-world examples:**\n`;
          explanation += `• Adding a new contact to your phone\n`;
          explanation += `• Adding an item to your shopping cart\n`;
          explanation += `• Adding a new task to your to-do list\n\n`;
          explanation += `The list grows by one item, and you can access this new item later along with all the others!`;
        } else {
          explanation = `⚙️ **Processing Step**\n\n**Action:** ${originalText}\n\n`;
          explanation += `🔧 **What's happening:**\n`;
          explanation += `The program is performing this operation as one step in completing its overall task.\n\n`;
          explanation += `💡 **Think of it like following a recipe:** Each step is important and builds on the previous ones. Skip a step, and you might not get the right result!\n\n`;
          explanation += `This particular step takes us one step closer to the final answer or result.`;
        }
        break;
      
      case 'function':
        explanation = `🔧 **Function**\n\n**Name:** ${node.text || node.label}\n\nThis is a reusable piece of code that can be called multiple times.`;
        break;
      
      default:
        explanation = `📋 **Step**\n\n${node.text || node.label}`;
        break;
    }
    
    // Add line number info
    if (node.lineNumber) {
      explanation += `\n\n📍 **Line ${node.lineNumber}** in your code`;
    }
    
    return explanation;
  };

  return (
    <main style={styles.container}>
      <div style={styles.splitContainer}>
        {/* Left side - Code Editor */}
        <section style={styles.leftPanel}>
          <div style={styles.controls}>
            <select 
              value={lang} 
              onChange={(e) => {
                const newLang = e.target.value;
                setLang(newLang);
                setCode(codeTemplates[newLang]);
              }} 
              style={styles.select}
            >
              <option value="python">Python</option>
              <option value="javascript">JavaScript</option>
              <option value="java">Java</option>
              <option value="c">C</option>
              <option value="cpp">C++</option>
              <option value="sql">SQL</option>
              <option value="html">HTML/CSS</option>
            </select>

            <button onClick={handleGenerate} style={styles.button}>
              Generate Flowchart
            </button>
            
            {graph && (
              <button onClick={handleExportImage} style={{...styles.button, background: '#059669'}}>
                📥 Export PNG
              </button>
            )}
            
            {code && (
              <button onClick={handleClearCode} style={{...styles.button, background: '#dc2626'}}>
                🗑️ Clear
              </button>
            )}
          </div>

          <textarea
            ref={textareaRef}
            value={code}
            onChange={(e) => setCode(e.target.value)}
            style={styles.textarea}
            placeholder="Paste your code here..."
          />

          {message && <div style={styles.message}>{message}</div>}
        </section>

        {/* Right side - Flowchart */}
        <section style={styles.rightPanel}>
          <h3 style={styles.flowchartTitle}>Flowchart {selectedNode && "& Explanation"}</h3>
          <div style={styles.flowchartContainer}>
            {graph ? (
              <div style={{ 
                display: 'flex', 
                gap: '20px', 
                height: '100%', 
                width: '100%',
                minWidth: 0,
                overflow: 'hidden'
              }}>
                {/* Flowchart Section */}
                <div style={{ 
                  flex: selectedNode ? '0 0 50%' : '1', 
                  minHeight: 0,
                  minWidth: 0,
                  display: 'flex',
                  flexDirection: 'column',
                  border: '2px solid #e5e7eb',
                  borderRadius: '8px',
                  background: '#ffffff',
                  overflow: 'hidden'
                }}>
                  <div style={{ 
                    flex: 1, 
                    overflow: 'auto',
                    padding: '20px',
                    display: 'flex',
                    alignItems: 'flex-start',
                    justifyContent: 'center'
                  }}>
                    <div id="flowchart-svg">
                      <SvgFlow graph={graph} onNodeClick={handleNodeClick} />
                    </div>
                  </div>
                </div>
                
                {/* Explanation Panel */}
                {selectedNode && (
                  <div style={{
                    flex: '0 0 48%',
                    minWidth: 0,
                    background: '#ffffff',
                    border: '2px solid #e5e7eb',
                    borderRadius: '8px',
                    display: 'flex',
                    flexDirection: 'column',
                    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
                    maxHeight: '100%'
                  }}>
                    <div style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      padding: '16px 20px',
                      borderBottom: '2px solid #e5e7eb',
                      flexShrink: 0,
                      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                    }}>
                      <h4 style={{
                        margin: 0,
                        fontSize: '1.1rem',
                        fontWeight: 600,
                        color: '#ffffff'
                      }}>💡 Step Explanation</h4>
                      <button 
                        onClick={() => {
                          setSelectedNode(null);
                        }} 
                        style={{
                          background: 'rgba(255,255,255,0.2)',
                          color: '#ffffff',
                          border: 'none',
                          fontSize: '20px',
                          cursor: 'pointer',
                          padding: '4px 10px',
                          borderRadius: '6px',
                          fontWeight: 'bold',
                          transition: 'all 0.2s ease',
                          flexShrink: 0
                        }}
                        onMouseOver={(e) => e.target.style.background = 'rgba(255,255,255,0.3)'}
                        onMouseOut={(e) => e.target.style.background = 'rgba(255,255,255,0.2)'}
                      >
                        ✕
                      </button>
                    </div>
                    <div style={{
                      flex: 1,
                      minHeight: 0,
                      overflow: 'auto',
                      background: '#f9fafb',
                      padding: '20px'
                    }}>
                      {getNodeExplanation(selectedNode).split('\n\n').map((paragraph, idx) => (
                        <div key={idx} style={{
                          marginBottom: '16px',
                          fontSize: '0.95rem',
                          lineHeight: 1.7,
                          color: '#374151'
                        }}>
                          {paragraph.split('**').map((part, i) => 
                            i % 2 === 1 ? (
                              <strong key={i} style={{ color: '#667eea', fontWeight: '600' }}>{part}</strong>
                            ) : (
                              <span key={i}>{part}</span>
                            )
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div style={styles.placeholder}>
                No flowchart yet — click "Generate Flowchart"
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}

const styles = {
  container: {
    maxWidth: '100%',
    margin: '24px auto',
    padding: '0 24px',
    height: 'calc(100vh - 100px)'
  },
  splitContainer: {
    display: 'flex',
    gap: 20,
    height: '100%'
  },
  leftPanel: {
    flex: '0 0 32%',
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden'
  },
  rightPanel: {
    flex: '1',
    background: '#fff',
    padding: 20,
    borderRadius: 12,
    boxShadow: '0 6px 18px rgba(2,6,23,0.06)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    minWidth: 0
  },
  controls: {
    display: 'flex',
    gap: 12,
    alignItems: 'center',
    marginBottom: 12,
    flexShrink: 0
  },
  select: {
    padding: '8px 10px',
    borderRadius: 8,
    border: '1px solid #e6e9ef',
    fontSize: 14,
    cursor: 'pointer'
  },
  button: {
    padding: '8px 14px',
    background: '#4b0082',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    cursor: 'pointer',
    transition: 'all .2s ease',
    boxShadow: '0 6px 12px rgba(75,0,130,0.08)',
    fontSize: 14,
    fontWeight: 600
  },
  textarea: {
    width: '100%',
    flex: 1,
    padding: 12,
    borderRadius: 10,
    border: '1px solid #e6e9ef',
    fontFamily: 'monospace',
    fontSize: 13,
    resize: 'none',
    outline: 'none',
    transition: 'border-color .2s ease'
  },
  flowchartTitle: {
    margin: '0 0 16px 0',
    fontSize: 18,
    fontWeight: 600,
    color: '#1f2937',
    flexShrink: 0
  },
  flowchartContainer: {
    flex: 1,
    minHeight: 0,
    display: 'flex',
    flexDirection: 'column'
  },
  message: {
    marginTop: 10,
    padding: '12px 16px',
    borderRadius: 8,
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    border: '1px solid #fca5a5',
    fontSize: '14px',
    fontWeight: '500',
    flexShrink: 0
  },
  placeholder: {
    color: '#9ca3af',
    padding: 40,
    textAlign: 'center',
    fontSize: 15
  }
};

export default Editor;