export const CHALLENGE_SCENARIOS: {
  topicTitle: string;
  title: string;
  scenario: string;
  question: string;
  hints: string[];
  difficulty_level: number;
  age_range_min: number;
  age_range_max: number;
}[] = [
  // Photosynthesis
  {
    topicTitle: 'Photosynthesis',
    title: 'The Dark Room Plant',
    scenario: 'Your friend keeps a plant in a closet with no windows. They water it every day but after two weeks the plant starts turning yellow and drooping.',
    question: 'Why is the plant dying even though it gets plenty of water?',
    hints: ['Think about what else plants need besides water', 'What do leaves use to make food?'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },
  {
    topicTitle: 'Photosynthesis',
    title: 'The Green Roof',
    scenario: 'A city wants to put plants on building rooftops to help clean the air. They need to decide between two plants: one with big leaves and one with small thick leaves.',
    question: 'Which plant would be better at cleaning the air, and why?',
    hints: ['Think about where photosynthesis happens', 'More surface area means more...'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Gravity
  {
    topicTitle: 'Gravity',
    title: 'The Moon Jump',
    scenario: 'An astronaut on the Moon can jump six times higher than on Earth. On Earth, they can jump about half a meter.',
    question: 'How high could they jump on the Moon? And why can they jump higher there?',
    hints: ['The Moon is smaller than Earth', 'Smaller objects have weaker...'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },
  {
    topicTitle: 'Gravity',
    title: 'The Feather Drop',
    scenario: 'Apollo 15 astronaut David Scott dropped a hammer and a feather on the Moon at the same time. On Earth, the hammer would hit the ground first.',
    question: 'What happened on the Moon? Did they hit the ground at the same time or not? Why?',
    hints: ['What slows the feather down on Earth?', 'Is there air on the Moon?'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // The Water Cycle
  {
    topicTitle: 'The Water Cycle',
    title: 'The Foggy Mirror',
    scenario: 'After a hot shower, the bathroom mirror gets all foggy and covered with tiny water drops.',
    question: 'Which part of the water cycle is happening on your mirror?',
    hints: ['Hot water creates steam (water vapor)', 'The mirror is cooler than the steam'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },

  // Food Chains
  {
    topicTitle: 'Food Chains',
    title: 'The Missing Wolves',
    scenario: 'In Yellowstone, wolves were removed for 70 years. Without wolves, the deer population exploded, they ate all the young trees, and the riverbanks started to erode.',
    question: 'How did removing wolves end up changing the rivers?',
    hints: ['More deer means more eating of plants', 'Tree roots hold soil in place'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // States of Matter
  {
    topicTitle: 'States of Matter',
    title: 'The Disappearing Puddle',
    scenario: 'After a rainstorm, there is a big puddle on the sidewalk. The next day the sun comes out and by afternoon the puddle is gone, but nobody cleaned it up.',
    question: 'Where did all the water go?',
    hints: ['The sun heats the water', 'Water can change from liquid to...'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },

  // Electricity Basics
  {
    topicTitle: 'Electricity Basics',
    title: 'The Broken Flashlight',
    scenario: 'You put fresh batteries in a flashlight, but it still does not turn on. You look inside and see one battery is put in backwards.',
    question: 'Why does the flashlight not work with a backwards battery?',
    hints: ['Electricity needs to flow in a loop', 'Batteries have a + and - end for a reason'],
    difficulty_level: 1,
    age_range_min: 7,
    age_range_max: 11,
  },

  // Forces and Motion
  {
    topicTitle: 'Forces and Motion',
    title: 'The Seatbelt Test',
    scenario: 'A car is driving at 60 km/h and suddenly stops. A ball sitting on the dashboard flies forward and hits the windshield.',
    question: 'Why did the ball keep moving forward when the car stopped?',
    hints: ['An object in motion stays in motion unless...', 'The brakes stopped the car, but what stopped the ball?'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Our Solar System
  {
    topicTitle: 'Our Solar System',
    title: 'The Hot and Cold Planet',
    scenario: 'Mercury is the closest planet to the Sun, but Venus is actually hotter. Mercury can reach 430°C during the day but drops to -180°C at night.',
    question: 'Why is Venus hotter than Mercury even though it is farther from the Sun?',
    hints: ['Venus has a thick atmosphere', 'Think about how a greenhouse works'],
    difficulty_level: 3,
    age_range_min: 9,
    age_range_max: 12,
  },

  // Sound and Vibrations
  {
    topicTitle: 'Sound and Vibrations',
    title: 'The String Phone',
    scenario: 'You and your friend make a phone from two cups connected by a string. When the string is tight, you can hear each other. When it is loose, you cannot.',
    question: 'Why does the string phone only work when the string is tight?',
    hints: ['Sound travels through vibrations', 'A loose string cannot carry...'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },

  // Animal Adaptations
  {
    topicTitle: 'Animal Adaptations',
    title: 'The Desert Fox',
    scenario: 'The fennec fox lives in the Sahara Desert and has enormous ears compared to its body. Its cousin, the Arctic fox, has very small ears.',
    question: 'Why do you think the desert fox has big ears and the Arctic fox has small ears?',
    hints: ['Big ears have more surface area', 'Think about heat — do you want to keep it or lose it?'],
    difficulty_level: 2,
    age_range_min: 7,
    age_range_max: 12,
  },

  // The Human Heart
  {
    topicTitle: 'The Human Heart',
    title: 'The Exercise Test',
    scenario: 'When you sit still, your heart beats about 70 times per minute. When you run really fast, it beats about 150 times per minute.',
    question: 'Why does your heart beat faster when you exercise?',
    hints: ['Your muscles need more energy when they work hard', 'What does blood carry to your muscles?'],
    difficulty_level: 1,
    age_range_min: 7,
    age_range_max: 11,
  },

  // Volcanoes
  {
    topicTitle: 'Volcanoes',
    title: 'The Island Builder',
    scenario: 'In 1963, fishermen near Iceland saw smoke coming from the ocean. Over the next few years, a brand new island called Surtsey appeared where there was only water before.',
    question: 'How did a volcano create a new island in the middle of the ocean?',
    hints: ['Lava cools and hardens when it hits water', 'Layer after layer builds up over time'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Atoms and Molecules
  {
    topicTitle: 'Atoms and Molecules',
    title: 'The Balloon Mystery',
    scenario: 'You blow up a balloon and leave it for a week. When you come back, it has gotten smaller even though you tied it tightly.',
    question: 'How did the air escape from a sealed balloon?',
    hints: ['Air is made of tiny molecules', 'The balloon material has tiny tiny spaces between its molecules'],
    difficulty_level: 3,
    age_range_min: 9,
    age_range_max: 12,
  },

  // How Light Works
  {
    topicTitle: 'How Light Works',
    title: 'The Blue Sky Mystery',
    scenario: 'On a clear day, the sky is blue. But during sunset, the sky turns orange and red.',
    question: 'Why does the sky change color at sunset?',
    hints: ['Sunlight contains all colors', 'Light scatters when it hits tiny particles in the air'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Magnets and Magnetism
  {
    topicTitle: 'Magnets and Magnetism',
    title: 'The Compass Puzzle',
    scenario: 'A hiker notices their compass needle always points north, no matter which direction they walk or turn.',
    question: 'What is making the compass needle always point north?',
    hints: ['Earth has something in common with a magnet', 'Opposite poles attract'],
    difficulty_level: 1,
    age_range_min: 6,
    age_range_max: 10,
  },

  // Earthquakes
  {
    topicTitle: 'Earthquakes',
    title: 'The Shaky Building',
    scenario: 'Two buildings are next to each other during an earthquake. One is stiff and cracks apart. The other is flexible and sways but stays standing.',
    question: 'Why did the flexible building survive better than the stiff one?',
    hints: ['Think about bending a stick vs. a rubber band', 'Flexible things can absorb energy'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Rocks and Minerals
  {
    topicTitle: 'Rocks and Minerals',
    title: 'The Fossil Hunt',
    scenario: 'You find a fossil of a fish on top of a tall mountain, far from any ocean.',
    question: 'How did a fish fossil end up on top of a mountain?',
    hints: ['Mountains were not always mountains', 'Earth\'s surface changes over millions of years'],
    difficulty_level: 2,
    age_range_min: 8,
    age_range_max: 12,
  },

  // Moon Phases
  {
    topicTitle: 'Moon Phases',
    title: 'The Half Moon Question',
    scenario: 'You look up at the sky and see exactly half the Moon lit up. Your friend says the other half has been eaten by a space monster.',
    question: 'What is really happening? Why can you only see half the Moon?',
    hints: ['The Moon does not make its own light', 'Think about where the Sun is shining on the Moon'],
    difficulty_level: 1,
    age_range_min: 7,
    age_range_max: 11,
  },

  // Weather and Climate
  {
    topicTitle: 'Weather and Climate',
    title: 'The Snowy Desert',
    scenario: 'Antarctica is the coldest place on Earth, but it is technically a desert. It gets less precipitation than the Sahara.',
    question: 'How can the coldest place on Earth be a desert?',
    hints: ['What defines a desert?', 'Deserts are about precipitation, not temperature'],
    difficulty_level: 3,
    age_range_min: 9,
    age_range_max: 12,
  },
];
