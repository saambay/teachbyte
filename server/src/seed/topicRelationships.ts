export const TOPIC_RELATIONSHIPS: {
  fromTitle: string;
  toTitle: string;
  type: 'prerequisite' | 'related' | 'builds_on';
}[] = [
  // Biology connections
  { fromTitle: 'Photosynthesis', toTitle: 'Plant Life Cycle', type: 'builds_on' },
  { fromTitle: 'Photosynthesis', toTitle: 'Food Chains', type: 'related' },
  { fromTitle: 'Photosynthesis', toTitle: 'Habitats and Ecosystems', type: 'related' },
  { fromTitle: 'Animal Adaptations', toTitle: 'Habitats and Ecosystems', type: 'related' },
  { fromTitle: 'Animal Adaptations', toTitle: 'Food Chains', type: 'related' },
  { fromTitle: 'The Human Heart', toTitle: 'How Lungs Work', type: 'related' },
  { fromTitle: 'Food Chains', toTitle: 'Habitats and Ecosystems', type: 'related' },
  { fromTitle: 'Food Chains', toTitle: 'Plant Life Cycle', type: 'related' },
  { fromTitle: 'How Lungs Work', toTitle: 'The Human Heart', type: 'related' },
  { fromTitle: 'Plant Life Cycle', toTitle: 'Photosynthesis', type: 'prerequisite' },
  { fromTitle: 'Habitats and Ecosystems', toTitle: 'Animal Adaptations', type: 'builds_on' },
  { fromTitle: 'Habitats and Ecosystems', toTitle: 'The Water Cycle', type: 'related' },

  // Physics connections
  { fromTitle: 'Gravity', toTitle: 'Forces and Motion', type: 'related' },
  { fromTitle: 'Gravity', toTitle: 'Our Solar System', type: 'related' },
  { fromTitle: 'Gravity', toTitle: 'Moon Phases', type: 'related' },
  { fromTitle: 'How Light Works', toTitle: 'Stars and Constellations', type: 'related' },
  { fromTitle: 'How Light Works', toTitle: 'Day and Night', type: 'related' },
  { fromTitle: 'Sound and Vibrations', toTitle: 'Forces and Motion', type: 'related' },
  { fromTitle: 'Sound and Vibrations', toTitle: 'Electricity Basics', type: 'related' },
  { fromTitle: 'Magnets and Magnetism', toTitle: 'Electricity Basics', type: 'related' },
  { fromTitle: 'Magnets and Magnetism', toTitle: 'Forces and Motion', type: 'related' },
  { fromTitle: 'Electricity Basics', toTitle: 'Magnets and Magnetism', type: 'builds_on' },
  { fromTitle: 'Forces and Motion', toTitle: 'Gravity', type: 'builds_on' },

  // Earth Science connections
  { fromTitle: 'The Water Cycle', toTitle: 'Weather and Climate', type: 'related' },
  { fromTitle: 'The Water Cycle', toTitle: 'States of Matter', type: 'related' },
  { fromTitle: 'Weather and Climate', toTitle: 'The Water Cycle', type: 'builds_on' },
  { fromTitle: 'Weather and Climate', toTitle: 'Habitats and Ecosystems', type: 'related' },
  { fromTitle: 'Volcanoes', toTitle: 'Rocks and Minerals', type: 'related' },
  { fromTitle: 'Volcanoes', toTitle: 'Earthquakes', type: 'related' },
  { fromTitle: 'Rocks and Minerals', toTitle: 'Volcanoes', type: 'related' },
  { fromTitle: 'Rocks and Minerals', toTitle: 'Earthquakes', type: 'related' },
  { fromTitle: 'Earthquakes', toTitle: 'Volcanoes', type: 'related' },

  // Space connections
  { fromTitle: 'Our Solar System', toTitle: 'Stars and Constellations', type: 'related' },
  { fromTitle: 'Our Solar System', toTitle: 'Gravity', type: 'builds_on' },
  { fromTitle: 'Stars and Constellations', toTitle: 'Our Solar System', type: 'related' },
  { fromTitle: 'Stars and Constellations', toTitle: 'How Light Works', type: 'related' },
  { fromTitle: 'Moon Phases', toTitle: 'Day and Night', type: 'related' },
  { fromTitle: 'Moon Phases', toTitle: 'Gravity', type: 'related' },
  { fromTitle: 'Day and Night', toTitle: 'Our Solar System', type: 'related' },
  { fromTitle: 'Day and Night', toTitle: 'Moon Phases', type: 'prerequisite' },

  // Chemistry connections
  { fromTitle: 'States of Matter', toTitle: 'The Water Cycle', type: 'related' },
  { fromTitle: 'States of Matter', toTitle: 'Atoms and Molecules', type: 'builds_on' },
  { fromTitle: 'Mixtures and Solutions', toTitle: 'States of Matter', type: 'builds_on' },
  { fromTitle: 'Mixtures and Solutions', toTitle: 'Atoms and Molecules', type: 'related' },
  { fromTitle: 'Atoms and Molecules', toTitle: 'States of Matter', type: 'prerequisite' },
  { fromTitle: 'Atoms and Molecules', toTitle: 'Mixtures and Solutions', type: 'prerequisite' },

  // Cross-domain connections
  { fromTitle: 'Photosynthesis', toTitle: 'How Light Works', type: 'related' },
  { fromTitle: 'The Human Heart', toTitle: 'Food Chains', type: 'related' },
  { fromTitle: 'Electricity Basics', toTitle: 'Atoms and Molecules', type: 'related' },
];
