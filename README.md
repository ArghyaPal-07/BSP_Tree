Interactive Polygon-Based BSP Tree Visualization

Project Overview

This project is an interactive web application that implements and visualizes a Polygon-Based Binary Space Partitioning (BSP) Tree from scratch.

It demonstrates the core Abstract Data Type (ADT) operations for a BSP Tree, showing how the tree is dynamically modified as new polygons are inserted. Its primary purpose is to showcase a working application of the ADT by solving a classic computer graphics problem: the Painter's Algorithm for 2D hidden surface removal.

## Features

### Core Functionality
- **Dynamic ADT Operations**: Add new rectangles and see the BSP tree modify its structure in real-time
- **Efficient Spatial Queries**: Perform region searches to find intersecting rectangles
- **Axis-Aligned Partitioning**: Alternating vertical and horizontal partitions for efficient space division

### Interactive Interface
- **Multi-View Interface**:
  - **Spatial View**: 2D canvas showing rectangles and partition lines with unique partition numbers
  - **Tree Structure View**: Live hierarchical diagram of the BSP Tree ADT, showing left (green) and right (red) child nodes
  - **ADT Operations View**: Educational tab explaining the pseudo-code for key operations
- **Real-time Statistics**: Dashboard showing rectangle count, tree height, partition count, and total nodes

### Technical Features
- **Sequential Partition Numbering**: Each partition is assigned a unique identifier
- **No Object Splitting**: Objects are stored at spanning nodes, eliminating the need for splitting
- **Efficient Region Search**: O(√n + k) complexity for spatial queries
- **Interactive Controls**: Add rectangles, perform searches, and clear the scene

## Implementation Details

### Data Structures

```typescript
// Node Structure
class AABSPNode {
  partitionNumber: number;    // Unique partition identifier
  axis: 'x' | 'y';           // Partition axis (vertical/horizontal)
  value: number;             // Position on axis
  left: AABSPNode | null;    // Left/top subtree
  right: AABSPNode | null;   // Right/bottom subtree
  rectangles: Rectangle[];    // Objects at this node
}

// Rectangle Object
interface Rectangle {
  id: number;
  x: number;
  y: number;
  width: number;
  height: number;
  color: string;
}
```

### Key Operations

1. **INSERT** (O(log n) average case)
   - Classifies rectangle against partition
   - Stores spanning rectangles at current node
   - Recursively inserts into appropriate subtree

2. **SEARCH** (O(√n + k) where k = results found)
   - Efficiently finds all rectangles in query region
   - Prunes irrelevant subtrees
   - Returns intersecting rectangles

3. **CLASSIFY** (O(1))
   - Determines rectangle position relative to partition
   - Returns LEFT, RIGHT, or SPANNING

## Applications

- **Game Development**: Fast collision detection and spatial querying
- **GIS Systems**: Efficient viewport queries and region searches
- **CAD Software**: Object selection and intersection testing
- **Spatial Databases**: R-tree like spatial indexing
- **Physics Engines**: Broadphase collision detection

## Technical Stack

- **Frontend Framework**: React
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Icons**: Lucide-React
- **Build Tool**: Vite

## Local Development

1. **Clone the Repository**
   ```bash
   git clone https://github.com/ArghyaPal-07/BSP_Tree.git
   cd bsp-tree-advanced
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

Install Tailwind CSS and its dependencies:

npm install -D tailwindcss postcss autoprefixer


Initialize Tailwind CSS:

This command creates tailwind.config.js and postcss.config.js.

npx tailwindcss init -p


Configure tailwind.config.js:

Open tailwind.config.js and add the content paths so Tailwind scans your files.

/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {},
  },
  plugins: [],
}


Configure src/index.css:

Clear this file and add the Tailwind directives.

@tailwind base;
@tailwind components;
@tailwind utilities;


Install Icons:

npm install lucide-react


Run the project:

npm run dev
   ```

## Performance Characteristics

- **Insertion**: O(log n) average case, O(n) worst case
- **Search**: O(√n + k) where k = number of results found
- **Space Complexity**: O(n) - no object splitting needed
- **Tree Height**: O(log n) balanced, O(n) worst case

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

For more information about BSP Trees and their applications, check out the ADT Operations tab in the application.


Install Icons:

npm install lucide-react


Run the project:

npm run dev
