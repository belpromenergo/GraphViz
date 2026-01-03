
export const theoryData = {
  derivative: {
    en: {
      title: "Derivatives",
      content: "The derivative of a function measures the sensitivity to change of the function value with respect to a change in its argument.",
      history: "Developed independently by Isaac Newton and Gottfried Wilhelm Leibniz in the late 17th century. Newton used it for physics (fluxions), while Leibniz focused on geometry.",
      example: "In physics, the derivative of position is velocity, and the derivative of velocity is acceleration. Engineers use it to find the stress distribution in structures."
    },
    ru: {
      title: "Производные",
      content: "Производная функции — это характеристика скорости изменения функции в данной точке. Геометрически она равна тангенсу угла наклона касательной.",
      history: "Создана независимо Исааком Ньютоном и Готфридом Лейбницем в конце XVII века. Ньютон рассматривал её через призму механики, а Лейбниц — через геометрию.",
      example: "В физике производная от пути по времени — это скорость. Автомобильный спидометр показывает именно значение производной функции пройденного пути."
    }
  },
  integral: {
    en: {
      title: "Integrals",
      content: "A definite integral represents the area bounded by the graph and the x-axis. It is the limit of Riemann sums.",
      history: "Archimedes used the 'method of exhaustion' for areas, but the formal Calculus was unified by Newton/Leibniz.",
      example: "Used to calculate the volume of fuel in irregularly shaped tanks or the total amount of energy consumed over time."
    },
    ru: {
      title: "Интегралы",
      content: "Определенный интеграл — это площадь криволинейной трапеции. Он связывает скорость накопления величины с её общим объемом.",
      history: "Идеи зародились еще у Архимеда при вычислении площадей круга, но современный вид интеграл приобрел благодаря трудам Коши и Римана.",
      example: "Применяется в экономике для расчета суммарного дохода компании за период или в строительстве для вычисления объемов сложных конструкций."
    }
  },
  extrema: {
    en: {
      title: "Extrema",
      content: "Maximum and minimum points where the derivative changes sign or is zero.",
      history: "Fermat (1636) was the first to propose that the derivative must be zero at maximum or minimum points.",
      example: "Companies use extrema to find the optimal price point that maximizes profit or to find the minimum amount of material needed for packaging."
    },
    ru: {
      title: "Экстремумы",
      content: "Максимальные и минимальные значения функции. В этих точках функция перестает расти и начинает убывать (или наоборот).",
      history: "Пьер Ферма в 1636 году первым предложил способ нахождения максимумов через равенство нулю скорости изменения функции.",
      example: "Логистические компании используют поиск экстремумов для минимизации затрат на топливо при выборе маршрутов доставки."
    }
  },
  limits: {
    en: {
      title: "Limits",
      content: "Describes the behavior of a function as the input approaches a specific value.",
      history: "The modern ε-δ definition was formulated by Bolzano and Cauchy, and later refined by Karl Weierstrass in the 19th century.",
      example: "Used in computer graphics to simulate motion blur and in electronics to understand transient behavior of circuits as time approaches infinity."
    },
    ru: {
      title: "Пределы",
      content: "Описание поведения функции при стремлении аргумента к определенному значению.",
      history: "Современное строгое определение через 'эпсилон-дельта' было дано Огюстеном Коши и окончательно доработано Карлом Вейерштрассом в XIX веке.",
      example: "Используются в финансах при расчете сложных процентов, когда период начисления стремится к бесконечно малым интервалам."
    }
  }
};
