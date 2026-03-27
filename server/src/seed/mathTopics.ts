export const MATH_TOPICS = [
  {
    title: 'Fractions',
    domain: 'math',
    description: 'How to split things into equal parts and compare them.',
    key_concepts: ['A fraction shows part of a whole', 'The top number (numerator) counts the parts', 'The bottom number (denominator) shows how many equal parts', 'Equivalent fractions look different but are the same amount'],
    common_misconceptions: ['A bigger denominator means a bigger fraction', 'You can add fractions by adding tops and bottoms separately', 'Fractions are always less than 1'],
    difficulty_level: 1,
    age_range_min: 7,
    age_range_max: 11,
  },
  {
    title: 'Multiplication Patterns',
    domain: 'math',
    description: 'How multiplying works and the cool patterns hidden in times tables.',
    key_concepts: ['Multiplication is repeated addition', 'Order does not matter: 3x4 = 4x3', 'Multiplying by 10 adds a zero', 'Doubling is the same as multiplying by 2'],
    common_misconceptions: ['Multiplication always makes numbers bigger', 'You have to memorize every fact individually', 'There are no patterns in times tables'],
    difficulty_level: 1,
    age_range_min: 7,
    age_range_max: 10,
  },
  {
    title: 'Geometry Shapes',
    domain: 'math',
    description: 'The properties of triangles, squares, circles, and other shapes.',
    key_concepts: ['Shapes are defined by their sides and angles', 'Triangles always have 3 sides', 'A circle has no corners or straight edges', 'Perimeter is the distance around a shape'],
    common_misconceptions: ['A square is not a rectangle', 'Bigger shapes always have more sides', 'All triangles look the same'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },
  {
    title: 'Area and Perimeter',
    domain: 'math',
    description: 'How to measure the space inside shapes and the distance around them.',
    key_concepts: ['Perimeter is the total length around a shape', 'Area is the space inside a shape', 'Area of a rectangle = length x width', 'Same perimeter can give different areas'],
    common_misconceptions: ['Area and perimeter are the same thing', 'Bigger perimeter always means bigger area', 'You need different formulas for every shape'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },
  {
    title: 'Decimals',
    domain: 'math',
    description: 'Numbers with a dot that show parts smaller than one whole.',
    key_concepts: ['A decimal point separates wholes from parts', '0.5 is the same as one half', 'Each place after the decimal is ten times smaller', 'Decimals and fractions can show the same amount'],
    common_misconceptions: ['More decimal places means a bigger number', '0.5 is less than 0.25 because 5 < 25', 'Decimals are completely different from fractions'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },
  {
    title: 'Probability Basics',
    domain: 'math',
    description: 'How likely something is to happen, from impossible to certain.',
    key_concepts: ['Probability goes from 0 (impossible) to 1 (certain)', 'A fair coin has a 50-50 chance', 'More possible outcomes means each one is less likely', 'Past results do not change future probability'],
    common_misconceptions: ['If something happened a lot, it is "due" to not happen', 'Probability can be greater than 1', 'Unlikely events are impossible'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },
  {
    title: 'Negative Numbers',
    domain: 'math',
    description: 'Numbers below zero and how they work in the real world.',
    key_concepts: ['Negative numbers are less than zero', 'A number line extends in both directions', 'Subtracting a negative is like adding', 'Temperature and debt use negative numbers'],
    common_misconceptions: ['Negative numbers do not exist in real life', 'A bigger negative number is worth more', 'You cannot subtract a bigger number from a smaller one'],
    difficulty_level: 3,
    age_range_min: 9,
    age_range_max: 12,
  },
  {
    title: 'Ratios and Proportions',
    domain: 'math',
    description: 'Comparing quantities and keeping things in balance.',
    key_concepts: ['A ratio compares two amounts', 'Proportions are equal ratios', 'Recipes use ratios to scale up or down', 'Maps use scale ratios to represent distances'],
    common_misconceptions: ['Ratios are the same as fractions', 'You can only compare things of the same type', 'Doubling one part doubles the ratio'],
    difficulty_level: 3,
    age_range_min: 9,
    age_range_max: 12,
  },
];

export const MATH_MICRO_LESSONS: Record<string, {
  explainer_points: string[];
  fun_facts: string[];
  visual_descriptions: string[];
}> = {
  'Fractions': {
    explainer_points: [
      'A fraction is a way to show part of something whole.',
      'The top number tells you how many pieces you have.',
      'The bottom number tells you how many equal pieces the whole was cut into.',
      'Half a pizza (1/2) is the same amount whether the pizza is big or small.',
    ],
    fun_facts: [
      'Did you know? Ancient Egyptians only used fractions with 1 on top (like 1/2, 1/3, 1/4)!',
    ],
    visual_descriptions: [
      'Imagine cutting a chocolate bar into 4 equal pieces. If you eat 3 pieces, you ate 3/4 of the bar!',
    ],
  },
  'Multiplication Patterns': {
    explainer_points: [
      'Multiplication is a shortcut for adding the same number over and over.',
      '3 x 4 means "three groups of four" which is 4 + 4 + 4 = 12.',
      'The times table has hidden patterns — like the 9s always add up to 9.',
      'You can multiply in any order: 3 x 4 = 4 x 3.',
    ],
    fun_facts: [
      'Did you know? If you multiply any number by 9 and add the digits, you always get 9! (9x7=63, 6+3=9)',
    ],
    visual_descriptions: [
      'Imagine arranging 12 apples into rows. You could make 3 rows of 4, or 4 rows of 3 — same number of apples either way!',
    ],
  },
  'Geometry Shapes': {
    explainer_points: [
      'Shapes are everywhere — windows are rectangles, wheels are circles, roofs are triangles.',
      'You can tell shapes apart by counting their sides and corners.',
      'A triangle always has exactly 3 sides and 3 corners.',
      'A circle is special — it has no straight sides and no corners at all.',
    ],
    fun_facts: [
      'Did you know? Honeybees build their honeycombs in hexagon shapes because hexagons fit together with no gaps!',
    ],
    visual_descriptions: [
      'Look around your room — the door is a rectangle, the clock is a circle, and a slice of pizza is a triangle!',
    ],
  },
  'Area and Perimeter': {
    explainer_points: [
      'Perimeter is like walking all the way around a shape — it is the total distance.',
      'Area is like painting the inside of a shape — it is the total space.',
      'To find the area of a rectangle, multiply the length times the width.',
      'A shape can have the same perimeter but different areas!',
    ],
    fun_facts: [
      'Did you know? Farmers use area to figure out how much seed they need for a field!',
    ],
    visual_descriptions: [
      'Imagine fencing a garden (perimeter) vs. laying sod inside it (area) — one goes around, the other fills inside.',
    ],
  },
  'Decimals': {
    explainer_points: [
      'A decimal point separates whole numbers from smaller parts.',
      '0.5 is the same as half — like half a dollar is 50 cents.',
      'Each spot after the decimal gets ten times smaller: tenths, hundredths, thousandths.',
      'Money uses decimals every day: $3.75 means 3 dollars and 75 cents.',
    ],
    fun_facts: [
      'Did you know? The number pi (3.14159...) has decimals that go on forever and never repeat!',
    ],
    visual_descriptions: [
      'Imagine a ruler: the big marks are whole numbers, and the tiny marks between them are decimals!',
    ],
  },
  'Probability Basics': {
    explainer_points: [
      'Probability tells you how likely something is to happen.',
      'Impossible = 0, certain = 1, and everything else is in between.',
      'Flipping a fair coin gives you a 50-50 (or 0.5) chance of heads.',
      'Rolling a die gives each number a 1 in 6 chance.',
    ],
    fun_facts: [
      'Did you know? You are more likely to be struck by lightning than win the lottery!',
    ],
    visual_descriptions: [
      'Imagine a bag with 3 red marbles and 1 blue marble. Reaching in blind, you are 3 times more likely to grab red!',
    ],
  },
  'Negative Numbers': {
    explainer_points: [
      'Negative numbers are numbers below zero — they live on the left side of a number line.',
      'Temperature uses negatives: -10°C is colder than 0°C.',
      'Owing money is like a negative: if you have -5 dollars, you owe someone 5 dollars.',
      'Subtracting a negative is like adding — two negatives make a positive!',
    ],
    fun_facts: [
      'Did you know? The coldest temperature ever recorded on Earth was -89.2°C in Antarctica!',
    ],
    visual_descriptions: [
      'Imagine an elevator that goes underground: floor 0 is ground level, floor -1 is one floor below, floor -3 is three floors below.',
    ],
  },
  'Ratios and Proportions': {
    explainer_points: [
      'A ratio compares two things — like "for every 2 cats, there are 3 dogs" is a 2:3 ratio.',
      'Proportions are when two ratios are equal — like a recipe doubled.',
      'Maps use ratios: 1 cm on the map might equal 1 km in real life.',
      'If a recipe uses 2 cups of flour for 12 cookies, you need 4 cups for 24 cookies.',
    ],
    fun_facts: [
      'Did you know? The Golden Ratio (about 1:1.618) appears in sunflowers, seashells, and even the Mona Lisa!',
    ],
    visual_descriptions: [
      'Imagine mixing paint: 1 part blue + 2 parts yellow = green. To make more of the same green, keep that 1:2 ratio!',
    ],
  },
};
