// src/BSPTreeVisualization.tsx

import React, { useState, useEffect, useRef } from 'react'; // Added useRef
import { Play, Pause, RotateCcw, Plus, Trash2, Eye, Code, Zap } from 'lucide-react';

// --- TYPE DEFINITIONS (The Fix) ---
// We define the "shape" of our data first.

interface Point {
  x: number;
  y: number;
}

interface Polygon {
  id: number;
  points: Point[];
  color: string;
}

interface Partition {
  point: Point;
  normal: Point; // Using Point for {x, y} structure
}

// --- BSP Tree Node ADT (Typed) ---
class BSPNode {
  // We must declare class properties in TypeScript
  public partition: Partition;
  public front: BSPNode | null;
  public back: BSPNode | null;
  public polygons: Polygon[];

  constructor(partition: Partition, front: BSPNode | null = null, back: BSPNode | null = null, polygons: Polygon[] = []) {
    this.partition = partition;
    this.front = front;
    this.back = back;
    this.polygons = polygons;
  }
}

// --- BSP Tree ADT Implementation (Typed) ---
class BSPTree {
  // We must declare the 'root' property
  public root: BSPNode | null = null;

  constructor() {
    this.root = null;
  }

  // Add type annotation for 'polygon'
  insert(polygon: Polygon) {
    if (!this.root) {
      this.root = new BSPNode(
        this.createPartition(polygon),
        null,
        null,
        [polygon]
      );
      return;
    }
    this._insertHelper(this.root, polygon);
  }

  _insertHelper(node: BSPNode, polygon: Polygon) {
    const classification = this.classifyPolygon(polygon, node.partition);
    
    if (classification === 'COPLANAR') {
      node.polygons.push(polygon);
    } else if (classification === 'FRONT') {
      if (!node.front) {
        node.front = new BSPNode(
          this.createPartition(polygon),
          null,
          null,
          [polygon]
        );
      } else {
        this._insertHelper(node.front, polygon);
      }
    } else if (classification === 'BACK') {
      if (!node.back) {
        node.back = new BSPNode(
          this.createPartition(polygon),
          null,
          null,
          [polygon]
        );
      } else {
        this._insertHelper(node.back, polygon);
      }
    } else if (classification === 'SPANNING') {
      const { front, back } = this.splitPolygon(polygon, node.partition);
      if (front) this._insertHelper(node, front);
      if (back) this._insertHelper(node, back);
    }
  }

  createPartition(polygon: Polygon): Partition {
    const p1 = polygon.points[0];
    const p2 = polygon.points[1];
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const normal = { x: -dy, y: dx };
    const len = Math.sqrt(normal.x * normal.x + normal.y * normal.y);
    return {
      point: p1,
      normal: { x: normal.x / len, y: normal.y / len }
    };
  }

  classifyPolygon(polygon: Polygon, partition: Partition): string {
    let frontCount = 0;
    let backCount = 0;
    const EPSILON = 0.1;

    for (const point of polygon.points) {
      const dist = this.pointToPlaneDistance(point, partition);
      if (dist > EPSILON) frontCount++;
      else if (dist < -EPSILON) backCount++;
    }

    if (frontCount > 0 && backCount === 0) return 'FRONT';
    if (backCount > 0 && frontCount === 0) return 'BACK';
    if (frontCount === 0 && backCount === 0) return 'COPLANAR';
    return 'SPANNING';
  }

  pointToPlaneDistance(point: Point, partition: Partition): number {
    const dx = point.x - partition.point.x;
    const dy = point.y - partition.point.y;
    return dx * partition.normal.x + dy * partition.normal.y;
  }

  splitPolygon(polygon: Polygon, partition: Partition): { front: Polygon | null; back: Polygon | null } {
    const frontPoints: Point[] = [];
    const backPoints: Point[] = [];

    for (let i = 0; i < polygon.points.length; i++) {
      const curr = polygon.points[i];
      const next = polygon.points[(i + 1) % polygon.points.length];
      
      const currDist = this.pointToPlaneDistance(curr, partition);
      const nextDist = this.pointToPlaneDistance(next, partition);

      if (currDist >= 0) frontPoints.push(curr);
      if (currDist <= 0) backPoints.push(curr);

      if ((currDist > 0 && nextDist < 0) || (currDist < 0 && nextDist > 0)) {
        const t = currDist / (currDist - nextDist);
        const intersection: Point = {
          x: curr.x + t * (next.x - curr.x),
          y: curr.y + t * (next.y - curr.y)
        };
        frontPoints.push(intersection);
        backPoints.push(intersection);
      }
    }

    return {
      front: frontPoints.length >= 3 ? { ...polygon, points: frontPoints } : null,
      back: backPoints.length >= 3 ? { ...polygon, points: backPoints } : null
    };
  }

  // Define types for viewpoint and callback
  traverseFrontToBack(viewpoint: Point, callback: (node: BSPNode) => void) {
    this._traverseHelper(this.root, viewpoint, callback);
  }

  _traverseHelper(node: BSPNode | null, viewpoint: Point, callback: (node: BSPNode) => void) {
    if (!node) return;

    const dist = this.pointToPlaneDistance(viewpoint, node.partition);

    if (dist > 0) {
      this._traverseHelper(node.back, viewpoint, callback);
      callback(node);
      this._traverseHelper(node.front, viewpoint, callback);
    } else {
      this._traverseHelper(node.front, viewpoint, callback);
      callback(node);
      this._traverseHelper(node.back, viewpoint, callback);
    }
  }

  getHeight(node: BSPNode | null = this.root): number {
    if (!node) return 0;
    return 1 + Math.max(this.getHeight(node.front), this.getHeight(node.back));
  }

  countNodes(node: BSPNode | null = this.root): number {
    if (!node) return 0;
    return 1 + this.countNodes(node.front) + this.countNodes(node.back);
  }
}

export default function BSPTreeVisualization() {
  // --- STATE HOOKS (Typed) ---
  // We provide the types to useState
  const [bspTree] = useState(() => new BSPTree());
  const [polygons, setPolygons] = useState<Polygon[]>([]); // This is now Polygon[]
  const [viewpoint, setViewpoint] = useState<Point>({ x: 250, y: 450 });
  const [renderOrder, setRenderOrder] = useState<Polygon[]>([]); // This is now Polygon[]
  const [isAnimating, setIsAnimating] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);
  const [mode, setMode] = useState<'spatial' | 'tree' | 'code'>('spatial');
  const [stats, setStats] = useState({ height: 0, nodes: 0 });

  // Ref for the SVG element (for mouse dragging)
  const svgRef = useRef<SVGSVGElement>(null);
  const [isDragging, setIsDragging] = useState(false);


  useEffect(() => {
    // Add type to samplePolygons
    const samplePolygons: Polygon[] = [
      { id: 1, points: [{x: 100, y: 200}, {x: 200, y: 200}, {x: 200, y: 300}, {x: 100, y: 300}], color: '#ef4444' },
      { id: 2, points: [{x: 250, y: 150}, {x: 350, y: 150}, {x: 350, y: 250}, {x: 250, y: 250}], color: '#3b82f6' },
      { id: 3, points: [{x: 150, y: 300}, {x: 250, y: 300}, {x: 250, y: 400}, {x: 150, y: 400}], color: '#10b981' },
      { id: 4, points: [{x: 300, y: 250}, {x: 400, y: 250}, {x: 400, y: 350}, {x: 300, y: 350}], color: '#f59e0b' },
    ];
    
    samplePolygons.forEach(poly => bspTree.insert(poly));
    setPolygons(samplePolygons); // Now assignable because types match
    updateRenderOrder();
    updateStats();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Disabling eslint warning for bspTree dependency

  const updateRenderOrder = () => {
    const order: Polygon[] = [];
    bspTree.traverseFrontToBack(viewpoint, (node) => {
      order.push(...node.polygons);
    });
    setRenderOrder(order);
  };

  const updateStats = () => {
    setStats({
      height: bspTree.getHeight(),
      nodes: bspTree.countNodes()
    });
  };

  const addRandomPolygon = () => {
    const x = Math.random() * 350 + 50;
    const y = Math.random() * 300 + 100;
    const size = Math.random() * 50 + 50;
    const colors = ['#ef4444', '#3b82f6', '#10b981', '#f59e0b', '#8b5cf6'];
    
    // Add type to newPoly
    const newPoly: Polygon = {
      id: Date.now(),
      points: [
        {x, y},
        {x: x + size, y},
        {x: x + size, y: y + size},
        {x, y: y + size}
      ],
      color: colors[Math.floor(Math.random() * colors.length)]
    };

    bspTree.insert(newPoly);
    setPolygons([...polygons, newPoly]);
    updateRenderOrder();
    updateStats();
  };

  const clearScene = () => {
    bspTree.root = null;
    setPolygons([]);
    setRenderOrder([]);
    setCurrentStep(0);
    setIsAnimating(false);
    updateStats();
  };

  const animateRender = () => {
    setIsAnimating(true);
    setCurrentStep(0);
  };

  useEffect(() => {
    if (isAnimating && currentStep < renderOrder.length) {
      const timer = setTimeout(() => setCurrentStep(currentStep + 1), 500);
      return () => clearTimeout(timer);
    } else if (currentStep >= renderOrder.length) {
      setIsAnimating(false);
    }
  }, [isAnimating, currentStep, renderOrder.length]);

  useEffect(() => {
    updateRenderOrder();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [viewpoint]);

  // --- MOUSE HANDLERS for dragging viewpoint ---
  const getMousePos = (e: React.MouseEvent<SVGSVGElement>): Point => {
    const rect = svgRef.current?.getBoundingClientRect();
    if (!rect) return { x: 0, y: 0 };
    return {
      x: e.clientX - rect.left,
      y: e.clientY - rect.top,
    };
  };

  const handleMouseDown = (e: React.MouseEvent<SVGSVGElement>) => {
    setIsDragging(true);
    setViewpoint(getMousePos(e));
  };

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!isDragging) return;
    setViewpoint(getMousePos(e));
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  // Add types for function parameters
  const drawTreeStructure = (node: BSPNode | null, x: number, y: number, level: number, xOffset: number): React.JSX.Element[] => {
    if (!node) return [];

    const nodeRadius = 25;
    const verticalGap = 80;
    const elements: React.JSX.Element[] = [];

    // Draw connections to children
    if (node.front) {
      const childX = x - xOffset;
      const childY = y + verticalGap;
      elements.push(
        <line key={`line-f-${x}-${y}`} x1={x} y1={y + nodeRadius} x2={childX} y2={childY - nodeRadius} 
              stroke="#10b981" strokeWidth="2" opacity="0.6" />
      );
      elements.push(...drawTreeStructure(node.front, childX, childY, level + 1, xOffset / 2));
    }

    if (node.back) {
      const childX = x + xOffset;
      const childY = y + verticalGap;
      elements.push(
        <line key={`line-b-${x}-${y}`} x1={x} y1={y + nodeRadius} x2={childX} y2={childY - nodeRadius} 
              stroke="#ef4444" strokeWidth="2" opacity="0.6" />
      );
      elements.push(...drawTreeStructure(node.back, childX, childY, level + 1, xOffset / 2));
    }

    // Draw node
    elements.push(
      <g key={`node-${x}-${y}`}>
        <circle cx={x} cy={y} r={nodeRadius} fill="#1f2937" stroke="#3b82f6" strokeWidth="2" />
        <text x={x} y={y - 5} textAnchor="middle" fill="white" fontSize="10" fontWeight="bold">
          P{node.polygons.length}
        </text>
        <text x={x} y={y + 8} textAnchor="middle" fill="#9ca3af" fontSize="9">
          ({node.partition.normal.x.toFixed(1)},{node.partition.normal.y.toFixed(1)})
        </text>
      </g>
    );

    return elements;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-gray-900 text-white p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-400 to-purple-500 bg-clip-text text-transparent">
            BSP Tree ADT Implementation
          </h1>
          <p className="text-gray-400">Binary Space Partitioning for Painter's Algorithm</p>
        </div>

        {/* Mode Selection */}
        <div className="flex gap-2 mb-6">
          <button onClick={() => setMode('spatial')} 
                  className={`px-4 py-2 rounded-lg transition ${mode === 'spatial' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Eye className="inline w-4 h-4 mr-2" />Spatial View
          </button>
          <button onClick={() => setMode('tree')} 
                  className={`px-4 py-2 rounded-lg transition ${mode === 'tree' ? 'bg-blue-600' : 'bg-gray-700 hover:bg-gray-600'}`}>
            <Zap className="inline w-4 h-4 mr-2" />Tree Structure
          </button>
          <button onClick={() => setMode('code')} 
                  className={`px-4 py-2 rounded-lg transition ${mode === 'code' ? 'bg-blue-600' : 'bg-gamma-700 hover:bg-gray-600'}`}>
            <Code className="inline w-4 h-4 mr-2" />ADT Operations
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Visualization */}
          <div className="lg:col-span-2">
            <div className="bg-gray-800 rounded-xl shadow-2xl p-6">
              {mode === 'spatial' && (
                <>
                  <h2 className="text-xl font-semibold mb-4">Spatial Partitioning & Rendering</h2>
                  {/* Added ref and mouse handlers to SVG */}
                  <svg 
                    ref={svgRef}
                    width="500" 
                    height="500" 
                    className="bg-gray-900 rounded-lg cursor-crosshair"
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                  >
                    {/* Grid */}
                    <defs>
                      <pattern id="grid" width="50" height="50" patternUnits="userSpaceOnUse">
                        <path d="M 50 0 L 0 0 0 50" fill="none" stroke="#374151" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="500" height="500" fill="url(#grid)" />

                    {/* Render polygons in BSP order */}
                    {(isAnimating ? renderOrder.slice(0, currentStep) : renderOrder).map((poly, idx) => (
                      <g key={`${poly.id}-${idx}`}> {/* Use a more unique key */}
                        <polygon 
                          points={poly.points.map(p => `${p.x},${p.y}`).join(' ')}
                          fill={poly.color}
                          stroke="white"
                          strokeWidth="2"
                          opacity={isAnimating ? 0.7 : 0.8}
                        />
                        <text x={poly.points[0].x + 10} y={poly.points[0].y + 20} 
                              fill="white" fontSize="12" fontWeight="bold">
                          {isAnimating ? idx + 1 : ''}
                        </text>
                      </g>
                    ))}

                    {/* Viewpoint */}
                    <circle cx={viewpoint.x} cy={viewpoint.y} r="8" fill="#fbbf24" stroke="white" strokeWidth="2" />
                    <text x={viewpoint.x + 15} y={viewpoint.y + 5} fill="#fbbf24" fontSize="12" fontWeight="bold">
                      Viewpoint
                    </text>

                    {/* Draw partition lines */}
                    {polygons.map((poly, idx) => {
                      const partition = bspTree.createPartition(poly);
                      const extendLength = 500;
                      const x1 = partition.point.x - partition.normal.y * extendLength;
                      const y1 = partition.point.y + partition.normal.x * extendLength;
                      const x2 = partition.point.x + partition.normal.y * extendLength;
                      const y2 = partition.point.y - partition.normal.x * extendLength;
                      
                      return (
                        <line key={`partition-${idx}`} x1={x1} y1={y1} x2={x2} y2={y2} 
                              stroke="#6366f1" strokeWidth="1" strokeDasharray="5,5" opacity="0.3" />
                      );
                    })}
                  </svg>
                  <div className="mt-4 text-sm text-gray-400">
                    <p>Click and drag to move viewpoint. Polygons render back-to-front using BSP tree traversal.</p>
                  </div>
                </>
              )}

              {mode === 'tree' && (
                <>
                  <h2 className="text-xl font-semibold mb-4">BSP Tree Structure</h2>
                  <svg width="500" height="500" className="bg-gray-900 rounded-lg">
                    {bspTree.root && drawTreeStructure(bspTree.root, 250, 40, 0, 120)}
                    <text x="10" y="20" fill="#10b981" fontSize="12">Front (Green)</text>
                    <text x="10" y="40" fill="#ef4444" fontSize="12">Back (Red)</text>
                  </svg>
                  <div className="mt-4 text-sm text-gray-400">
                    <p>Tree shows spatial partitioning hierarchy. Each node splits space into front/back.</p>
                  </div>
                </>
              )}

              {mode === 'code' && (
                <div className="h-[500px] overflow-y-auto">
                  <h2 className="text-xl font-semibold mb-4">ADT Operations</h2>
                  <div className="space-y-4 text-sm">
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-blue-400 font-semibold mb-2">1. INSERT Operation</h3>
                      <pre className="text-gray-300 text-xs overflow-x-auto">
{`insert(polygon):
  if tree is empty:
    create root with polygon's partition
  else:
    classify polygon against partition
    - COPLANAR: add to current node
    - FRONT: insert into front subtree
    - BACK: insert into back subtree
    - SPANNING: split and insert both parts`}
                      </pre>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-green-400 font-semibold mb-2">2. CLASSIFY Operation</h3>
                      <pre className="text-gray-300 text-xs overflow-x-auto">
{`classifyPolygon(polygon, partition):
  for each point in polygon:
    dist = dot(point - partition.point, normal)
    if dist > epsilon: frontCount++
    if dist < -epsilon: backCount++
  
  return classification based on counts`}
                      </pre>
                    </div>

D
                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-purple-400 font-semibold mb-2">3. SPLIT Operation</h3>
                      <pre className="text-gray-300 text-xs overflow-x-auto">
{`splitPolygon(polygon, partition):
  for each edge in polygon:
    if edge crosses partition:
      compute intersection point
      add to both front and back polygons
  return {frontPolygon, backPolygon}`}
                      </pre>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-yellow-400 font-semibold mb-2">4. TRAVERSE Operation</h3>
                      <pre className="text-gray-300 text-xs overflow-x-auto">
{`traverseFrontToBack(viewpoint):
  classify viewpoint against partition
  if viewpoint in front:
    traverse(back subtree)
    process current node
    traverse(front subtree)
  else:
    traverse(front subtree)
    process current node
    traverse(back subtree)`}
                      </pre>
                    </div>

                    <div className="bg-gray-900 p-4 rounded-lg">
                      <h3 className="text-red-400 font-semibold mb-2">5. Application: Painter's Algorithm</h3>
                      <p className="text-gray-300 text-xs">
                        BSP trees solve the visibility problem in 2D/3D graphics by ordering polygons 
                        back-to-front relative to any viewpoint. This enables correct rendering without 
                        z-buffering. Used in classic games like DOOM and Quake.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Control Panel */}
          <div className="space-y-6">
            {/* Stats */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Tree Statistics</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Polygons:</span>
                  <span className="text-2xl font-bold text-blue-400">{polygons.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Tree Height:</span>
                  <span className="text-2xl font-bold text-green-400">{stats.height}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Nodes:</span>
                  <span className="text-2xl font-bold text-purple-400">{stats.nodes}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-400">Render Order:</span>
                  <span className="text-2xl font-bold text-yellow-400">{renderOrder.length}</span>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Operations</h3>
              <div className="space-y-3">
                <button 
                  onClick={addRandomPolygon}
                  className="w-full bg-blue-600 hover:bg-blue-700 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                  <Plus className="w-5 h-5" />
                  Add Polygon (INSERT)
                </button>
                
                <button 
                  onClick={animateRender}
                  disabled={isAnimating}
                  className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-600 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                  {isAnimating ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  Animate Traversal
                </button>

                <button 
                  onClick={clearScene}
                  className="w-full bg-red-600 hover:bg-red-700 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                  <Trash2 className="w-5 h-5" />
                  Clear Scene
                </button>

                <button 
                  onClick={() => setViewpoint({ x: Math.random() * 400 + 50, y: Math.random() * 400 + 50 })}
                  className="w-full bg-purple-600 hover:bg-purple-700 px-4 py-3 rounded-lg transition flex items-center justify-center gap-2">
                  <RotateCcw className="w-5 h-5" />
                  Random Viewpoint
                </button>
              </div>
            </div>

            {/* Render Order */}
            <div className="bg-gray-800 rounded-xl p-6 shadow-2xl">
              <h3 className="text-lg font-semibold mb-4">Render Order</h3>
              <div className="space-y-2 max-h-48 overflow-y-auto">
                {renderOrder.map((poly, idx) => (
                  <div key={`${poly.id}-${idx}`} 
                       className="flex items-center gap-3 bg-gray-900 p-2 rounded">
                    <span className="text-gray-400 text-sm w-6">{idx + 1}.</span>
                    <div className="w-6 h-6 rounded" style={{ backgroundColor: poly.color }}></div>
                    <span className="text-sm text-gray-300">Polygon {poly.id}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Application Scenario */}
        <div className="mt-6 bg-gray-800 rounded-xl p-6 shadow-2xl">
          <h2 className="text-2xl font-bold mb-4 text-blue-400">Application: Painter's Algorithm for 2D Rendering</h2>
          <div className="grid md:grid-cols-2 gap-6 text-gray-300">
            <div>
              <h3 className="font-semibold text-white mb-2">Problem:</h3>
              <p className="text-sm mb-4">
                When rendering overlapping 2D/3D polygons, we need to determine which polygons are in front 
                and which are behind from any viewing angle. Traditional sorting is expensive and fails with 
                cyclic overlaps.
              </p>
              <h3 className="font-semibold text-white mb-2">BSP Tree Solution:</h3>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li>Preprocess scene into BSP tree (one-time cost)</li>
                <li>Each node partitions space with a plane</li>
                <li>Polygons split across partitions</li>
                <li>Tree structure encodes spatial relationships</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold text-white mb-2">Real-World Usage:</h3>
              <ul className="text-sm space-y-2 list-disc list-inside">
                <li><strong>Classic Game Engines:</strong> DOOM, Quake used BSP for level geometry</li>
                <li><strong>CAD Systems:</strong> Hidden surface removal in engineering software</li>
                <li><strong>Ray Tracing:</strong> Accelerating ray-geometry intersection tests</li>
                <li><strong>Collision Detection:</strong> Fast spatial queries for physics engines</li>
              </ul>
              <h3 className="font-semibold text-white mb-2 mt-4">Complexity:</h3>
              <ul className="text-sm space-y-1 list-disc list-inside">
                <li>Construction: O(n log n) average, O(n²) worst</li>
                <li>Traversal: O(n) where n = number of polygons</li>
                <li>Space: O(n) with potential splits</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}