// This file contains static data for the application.
// Exporting it allows other modules to import and use it.

export const ALL_CASES = [
    {
        id: 'berlin-wall',
        title: 'The Fall of the Wall',
        headline: 'Berlin Wall Tumbles',
        description: 'Analyze the political, social, and economic causes that led to the sudden collapse of the Berlin Wall in 1989.',
        difficulty: 'Moderate',
        evidence: [
            { id: 'e1', text: 'Economic problems in East Germany' },
            { id: 'e2', text: 'Gorbachev’s Reforms (1985)' },
            { id: 'e3', text: 'Mass protests in Leipzig (1989)' },
            { id: 'e4', text: 'Hungarian Border Opening (May 1989)' },
        ]
    },
    {
        id: 'industrial-rev',
        title: 'The Steam Age Mystery',
        headline: 'The Industrial Revolution Begins',
        description: 'Trace the key innovations, resource advantages, and policy changes that sparked the Industrial Revolution in Great Britain.',
        difficulty: 'Advanced',
        evidence: [
            { id: 'r1', text: 'Invention of the Spinning Jenny' },
            { id: 'r2', text: 'Access to coal and iron ore deposits' },
            { id: 'r3', text: 'Enclosure Acts' },
            { id: 'r4', text: 'Expansion of the British Empire' },
        ]
    }
];