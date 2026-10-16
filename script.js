
const display = document.getElementById("display");
const history = document.getElementById("history");
const angleButton = document.getElementById("angle");

let expression = "";
let degrees = true;
let justCalculated = false;

function updateDisplay() {
  display.value = expression || "0";
}

function insert(value) {
  if (justCalculated && /[0-9.pi e]/.test(value[0])) {
    expression = "";
  }

  justCalculated = false;

  if (expression.length + value.length > 100) return;

  if (expression === "Error") expression = "";

  expression += value;
  updateDisplay();
}

function clearAll() {
  expression = "";
  history.textContent = "Listo para calcular";
  justCalculated = false;
  updateDisplay();
}

function deleteLast() {
  if (expression === "Error") {
    clearAll();
    return;
  }

  expression = expression.slice(0, -1);
  justCalculated = false;
  updateDisplay();
}

// Analizador matemático: +, -, *, /, ^ y paréntesis.
function calculate(source) {
  const tokens = source.match(
    /(?:\d+\.?\d*|\.\d+)|(?:sin|cos|tan|sqrt|log|ln|pi|e)|[()+\-*/^%]/gi
  );

  if (!tokens || tokens.join("") !== source.replace(/\s/g, "")) {
    throw new Error("Expresión no válida");
  }

  let pos = 0;

  function peek() {
    return tokens[pos];
  }

  function take() {
    return tokens[pos++];
  }

  function parseExpression() {
    let value = parseTerm();

    while (peek() === "+" || peek() === "-") {
      const op = take();
      const right = parseTerm();
      value = op === "+" ? value + right : value - right;
    }

    return value;
  }

  function parseTerm() {
    let value = parseUnary();

    while (["*", "/", "%"].includes(peek())) {
      const op = take();
      const right = parseUnary();

      if (op === "*") value *= right;
      if (op === "/") value /= right;
      if (op === "%") value %= right;
    }

    return value;
  }

  function parseUnary() {
    if (peek() === "+") {
      take();
      return parseUnary();
    }

    if (peek() === "-") {
      take();
      return -parseUnary();
    }

    return parsePower();
  }

  function parsePower() {
    let value = parsePrimary();

    if (peek() === "^") {
      take();
      value = Math.pow(value, parseUnary());
    }

    return value;
  }

  function parsePrimary() {
    const token = take();

    if (token === undefined) {
      throw new Error("Falta un número");
    }

    if (token === "(") {
      const value = parseExpression();

      if (take() !== ")") {
        throw new Error("Falta cerrar paréntesis");
      }

      return value;
    }

    const name = token.toLowerCase();

    if (name === "pi") return Math.PI;
    if (name === "e") return Math.E;

    if (/^(?:\d+\.?\d*|\.\d+)$/.test(token)) {
      return Number(token);
    }

    if (["sin", "cos", "tan", "sqrt", "log", "ln"].includes(name)) {
      if (take() !== "(") {
        throw new Error("Usá paréntesis en la función");
      }

      const x = parseExpression();

      if (take() !== ")") {
        throw new Error("Falta cerrar paréntesis");
      }

      switch (name) {
        case "sin":
          return Math.sin(degrees ? x * Math.PI / 180 : x);
        case "cos":
          return Math.cos(degrees ? x * Math.PI / 180 : x);
        case "tan":
          return Math.tan(degrees ? x * Math.PI / 180 : x);
        case "sqrt":
          return Math.sqrt(x);
        case "log":
          return Math.log10(x);
        case "ln":
          return Math.log(x);
      }
    }

    throw new Error("Operación no válida");
  }

  const result = parseExpression();

  if (pos !== tokens.length || Number.isNaN(result)) {
    throw new Error("Expresión no válida");
  }

  if (!Number.isFinite(result)) {
    throw new Error("Resultado fuera de rango");
  }

  return result;
}

function equals() {
  if (!expression) return;

  try {
    const original = expression;
    const result = calculate(expression);

    history.textContent = original + " =";

    expression = Number(result.toPrecision(12)).toString();
    justCalculated = true;
    updateDisplay();
  } catch (error) {
    history.textContent = error.message || "Error de cálculo";
    display.value = "Error";
    expression = "Error";
    justCalculated = false;
  }
}

document.querySelector(".buttons").addEventListener("click", (event) => {
  const button = event.target.closest("button");
  if (!button) return;

  const action = button.dataset.action;
  const value = button.dataset.value;

  if (action === "clear") clearAll();
  else if (action === "delete") deleteLast();
  else if (action === "equals") equals();
  else if (value !== undefined) insert(value);
});

angleButton.addEventListener("click", () => {
  degrees = !degrees;
  angleButton.textContent = degrees ? "DEG" : "RAD";
});

document.addEventListener("keydown", (event) => {
  if (/^[0-9.+\-*/^()%]$/.test(event.key)) {
    insert(event.key);
  } else if (event.key === "Enter" || event.key === "=") {
    equals();
  } else if (event.key === "Backspace") {
    deleteLast();
  } else if (event.key === "Escape") {
    clearAll();
  }
});

updateDisplay();
