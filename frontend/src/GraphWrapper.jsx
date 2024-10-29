import React, { useEffect, useRef, useState } from 'react';
import { SigmaContainer, useSigma } from '@react-sigma/core';
import Graph from 'graphology';

// CSS for fade-in effect
const fadeInStyle = `
  .fade-in {
    opacity: 0;
    animation: fadeIn 1s forwards;
  }

  @keyframes fadeIn {
    to {
      opacity: 1;
    }
  }
`;

// Inject the CSS into the document
const styleSheet = document.createElement("style");
styleSheet.type = "text/css";
styleSheet.innerText = fadeInStyle;
document.head.appendChild(styleSheet);

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

function defineEdges(data, centralNodeId) {
  const edges = [];
  data.children.forEach((child) => {
    edges.push({ source: child.id, target: centralNodeId });
  });
  data.parents.forEach((parent) => {
    edges.push({ source: centralNodeId, target: parent.id });
  });
  return edges;
}

const GraphComponent = () => {
  let centralNodeLabel = 'Root';
  const sigma = useSigma();
  const containerRef = useRef(null);
  const [centralNode, setCentralNode] = useState({ id: 'Root', label: 'Root' });
  const [parentNodes, setParentNodes] = useState([]);
  const [childNodes, setChildNodes] = useState([]);
  const [edges, setEdges] = useState([]);

  // Function to get the label by node ID
  function getNodeLabelById(nodeId, nodes) {
    const node = nodes.find((node) => node.id === nodeId);
    return node ? node.label : null;
  }

  // Function to handle node clicks
  const handleNodeClick = (nodeId) => {
    centralNodeLabel = getNodeLabelById(nodeId, [...parentNodes, ...childNodes]);
    setCentralNode({ id: nodeId, label: centralNodeLabel });
  };

  // Function to add nodes and edges with a delay
  async function addNodesAndEdgesWithDelay(nodes, graph, centerX, centerY, startAngle, angleSpread, radius, edges) {
    for (const [index, node] of nodes.entries()) {
      const angle = startAngle + (index * angleSpread) / Math.max(1, nodes.length - 1);
      const x = centerX + radius * Math.cos(angle);
      const y = centerY + radius * Math.sin(angle);
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.label,
          size: 20,
          color: 'black',
          className: 'fade-in', // Apply the fade-in class
          x: x,
          y: y
        });
      }
      await sleep(100); // Wait for 200ms

      // Add edges related to this node
      edges.forEach(edge => {
        if (edge.source === node.id || edge.target === node.id) {
          if (!graph.hasEdge(edge.source, edge.target)) {
            try {
              graph.addEdge(edge.source, edge.target);
            } catch (error) {
              console.warn(`Failed to add edge from ${edge.source} to ${edge.target}:`, error);
            }
          }
        }
      });
      await sleep(50); // Wait for 100ms before adding the next edge
    }
  }

  // Sleep function to pause execution
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Effect to fetch data when central node changes
  useEffect(() => {
    if (!centralNode.id) return; // Ensure there's an ID

    fetchDataForKey(centralNode.id)
      .then((data) => {
        const parents = data.parents.map(({ id, label }) => ({
          id: id,
          label: label
        }));

        const children = data.children.map(({ id, label }) => ({
          id: id,
          label: label
        }));

        setParentNodes(parents);
        setChildNodes(children);
        setEdges(defineEdges(data, centralNode.id));
      })
      .catch((error) => {
        console.error('Error:', error);
      });
  }, [centralNode.id]);

  // Effect to update graph visualization
  useEffect(() => {
    // Create a new graph instance
    const graph = new Graph();

    // Add central node
    const centerX = 0;
    const centerY = 0;
    if (!graph.hasNode(centralNode.id)) {
      graph.addNode(centralNode.id, {
        label: centralNode.label,
        size: 20,
        color: 'black',
        className: 'fade-in', // Apply the fade-in class
        x: centerX,
        y: centerY
      });
    }

    // Add parent nodes and edges with delay
    const parentAngleSpread = Math.PI / 2;
    const parentRadius = 100;
    const parentStartAngle = 3 * Math.PI / 4;
    addNodesAndEdgesWithDelay(parentNodes, graph, centerX, centerY, parentStartAngle, parentAngleSpread, parentRadius, edges);

    // Add child nodes and edges with delay
    const childAngleSpread = Math.PI / 2;
    const childRadius = 100;
    const childStartAngle = 7 * Math.PI / 4;
    addNodesAndEdgesWithDelay(childNodes, graph, centerX, centerY, childStartAngle, childAngleSpread, childRadius, edges);

    // Clear any existing click handlers
    sigma.removeAllListeners('clickNode');
    
    // Set up click handler
    sigma.on('clickNode', (event) => {
      handleNodeClick(event.node);
    });

    // Clear the existing graph and set the new one
    sigma.setGraph(graph);
    sigma.refresh();

    // Cleanup function
    return () => {
      sigma.removeAllListeners('clickNode');
    };
  }, [sigma, parentNodes, childNodes, edges, centralNode]);

  return <div ref={containerRef} />;
};

const GraphWrapper = () => (
  <SigmaContainer>
    <GraphComponent />
  </SigmaContainer>
);

export default GraphWrapper;
