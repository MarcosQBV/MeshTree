import React, { useEffect, useRef, useState } from 'react';
import { SigmaContainer, useSigma } from '@react-sigma/core';
import Graph from 'graphology';

async function fetchDataForKey(key) {
  const baseUrl = 'http://localhost:5000';
  const url = `${baseUrl}/get/${key}`;

  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HTTP error! Status: ${response.status}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching data:', error);
    throw error;
  }
}

async function getNodeData(nodeID) {
  try {
    const data = await fetchDataForKey(nodeID);

    const center = data.central.map(({ id, label, scopenote }) => ({
      id: id,
      label: label,
      scopenote: scopenote
    }));

    const parents = data.parents.map(({ id, label, scopenote }) => ({
      id: id,
      label: label,
      scopenote: scopenote
    }));

    const children = data.children.map(({ id, label, scopenote }) => ({
      id: id,
      label: label,
      scopenote: scopenote
    }));

    return { center, parents, children };
  } catch (error) {
    console.error('Error fetching node data:', error);
    throw error;
  }
}

function defineEdges(data) {
  const centralNodeId = data.center[0].id; // Assuming center is an array with one element
  const edges = [];
  data.children.forEach((child) => {
    edges.push({ source: centralNodeId, target: child.id });
  });
  data.parents.forEach((parent) => {
    edges.push({ source: parent.id, target: centralNodeId });
  });
  return edges;
}

const GraphComponent = () => {
  const sigma = useSigma();
  const containerRef = useRef(null);
  const graphRef = useRef(new Graph()); // Persistent graph instance
  const [centralNode, setCentralNode] = useState({ id: 'Root', label: 'Root' });
  const [parentNodes, setParentNodes] = useState([]);
  const [childNodes, setChildNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [nodeLevel, setNodeLevel] = useState([]); // Initialize nodeLevel as a state
  const [centerX, setCenterX] = useState(0); // State for center X coordinate
  const [centerY, setCenterY] = useState(0); // State for center Y coordinate
  const [collapsedNodes, setCollapsedNodes] = useState(new Set()); // Track collapsed nodes and their children

  useEffect(() => {
    async function buildStarterTree(rootID) {
      try {
        const data = await getNodeData(rootID);
        const { center, children } = data;

        // Add the root node
        const rootNode = center[0];
        if (!graphRef.current.hasNode(rootNode.id)) {
          graphRef.current.addNode(rootNode.id, {
            label: rootNode.label,
            size: 20,
            color: 'blue',
            x: centerX,
            y: centerY
          });
        }

        // Add children nodes
        const childEdges = defineEdges(data);
        children.forEach((child, index) => {
          const angle = (index / children.length) * 2 * Math.PI;
          const x = centerX + 100 * Math.cos(angle);
          const y = centerY + 100 * Math.sin(angle);

          if (!graphRef.current.hasNode(child.id)) {
            graphRef.current.addNode(child.id, {
              label: child.label,
              size: 15,
              color: 'green',
              x: x,
              y: y
            });
          }
        });

        // Add edges
        childEdges.forEach(edge => {
          if (!graphRef.current.hasEdge(edge.source, edge.target)) {
            graphRef.current.addEdge(edge.source, edge.target);
          }
        });

        // Update state
        setCentralNode(rootNode);
        setChildNodes(children);
        setEdges(childEdges);
      } catch (error) {
        console.error('Error building parent tree:', error);
      }
    }

    buildStarterTree('Root'); // Call the function with the root node ID
  }, [sigma, centerX, centerY]);

  return <div ref={containerRef} />;
};

const GraphWrapper = () => (
  <SigmaContainer>
    <GraphComponent />
  </SigmaContainer>
);

export default GraphWrapper;
