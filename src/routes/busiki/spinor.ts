// 1. Базовый тип комплексного числа (координаты стрелки фазы)
type Complex = {
  re: number; // ось X (действительная часть)
  im: number; // ось Y (мнимая часть)
};

// Умножение комплексных чисел: (a + bi) * (c + di)
const mul = (a: Complex, b: Complex): Complex => ({
  re: a.re * b.re - a.im * b.im,
  im: a.re * b.im + a.im * b.re,
});

// 2. Спинор электрона — кортеж из двух комплексных амплитуд:
// up   — амплитуда состояния "спин вверх" (|↑⟩)
// down — амплитуда состояния "спин вниз"  (|↓⟩)
type Spinor = {
  up: Complex;
  down: Complex;
};

// 3. Оператор поворота вокруг оси Z на угол theta (в градусах)
// Это функция высшего порядка: принимает угол, возвращает преобразователь спинора
type SpinOperator = (state: Spinor) => Spinor;

function rotateZ(thetaDeg: number): SpinOperator {
  // Квантовая магия спина 1/2: угол в фазе делится на 2!
  const halfRad = ((thetaDeg / 2) * Math.PI) / 180;

  // Фазовые множители e^(-i * theta/2) и e^(+i * theta/2)
  const phaseUp: Complex = { re: Math.cos(halfRad), im: -Math.sin(halfRad) };
  const phaseDown: Complex = { re: Math.cos(halfRad), im: Math.sin(halfRad) };

  return (state: Spinor): Spinor => ({
    up: mul(phaseUp, state.up),
    down: mul(phaseDown, state.down),
  });
}

// 4. Измерение (схлопывание волновой функции в классический результат)
// Вероятность = квадрат длины стрелки: re^2 + im^2
function measureProbabilities(state: Spinor) {
  const probUp = state.up.re ** 2 + state.up.im ** 2;
  const probDown = state.down.re ** 2 + state.down.im ** 2;
  return {
    probUp: +probUp.toFixed(3),
    probDown: +probDown.toFixed(3),
  };
}

// --- ПРОВЕРКА В ДЕЙСТВИИ ---

// Пусть электрон в суперпозиции: 50% вверх, 50% вниз (1/√2 ≈ 0.707)
const invSqrt2 = Math.SQRT1_2;
const initialElectron: Spinor = {
  up: { re: invSqrt2, im: 0 },
  down: { re: invSqrt2, im: 0 },
};

// Делаем полный оборот на 360°
const after360 = rotateZ(360)(initialElectron);
// Результат: up = { re: -0.707, im: 0 }, down = { re: -0.707, im: 0 }
// Стрелки развернулись на 180° (поменяли знак на минус)!

// Делаем ещё один оборот (итого 720°)
const after720 = rotateZ(720)(initialElectron);
// Результат: up = { re: 0.707, im: 0 }, down = { re: 0.707, im: 0 }
// Стрелки вернулись в исходное состояние!

console.log('Исходный:', initialElectron);
console.log('После 360°:', after360);
console.log('После 720°:', after720);
console.log('Вероятности на 360°:', measureProbabilities(after360)); // { probUp: 0.5, probDown: 0.5 }
