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
    edges.push({ source: centralNodeId, target: child.id });
  });
  data.parents.forEach((parent) => {
    edges.push({ source: parent.id, target: centralNodeId });
  });
  return edges;
}

const GraphComponent = () => {
  let centralNodeLabel = 'Root';
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

  // Function to get the label by node ID
  function getNodeLabelById(nodeId, nodes) {
    const node = nodes.find((node) => node.id === nodeId);
    return node ? node.label : null;
  }

  // Function to handle node clicks
  const handleNodeClick = (nodeId) => {
    centralNodeLabel = getNodeLabelById(nodeId, [...parentNodes, ...childNodes]);
    setCentralNode({ id: nodeId, label: centralNodeLabel });

    // Get the coordinates of the clicked node
    const nodeAttributes = graphRef.current.getNodeAttributes(nodeId);
    setCenterX(nodeAttributes.x);
    setCenterY(nodeAttributes.y);
    
    const handleNodeClick = (nodeId) => {
      const newLabel = getNodeLabelById(nodeId, [...parentNodes, ...childNodes]);
      console.log(`Node clicked: ${nodeId}, Label: ${newLabel}`);
    
      if (newLabel) {
        setCentralNode({ id: nodeId, label: newLabel });
    
        // Get the coordinates of the clicked node
        const nodeAttributes = graphRef.current.getNodeAttributes(nodeId);
        setCenterX(nodeAttributes.x);
        setCenterY(nodeAttributes.y);
    
        // Remove the node from the collapsed nodes set to allow re-expansion
        setCollapsedNodes((prevCollapsed) => {
          const newCollapsed = new Set(prevCollapsed);
          newCollapsed.delete(nodeId);
          console.log('Collapsed nodes after click:', newCollapsed);
          return newCollapsed;
        });
      } else {
        console.warn(`Node label not found for ID: ${nodeId}`);
      }
    };
    

    // Remove the node from the collapsed nodes set to allow re-expansion
    setCollapsedNodes((prevCollapsed) => {
      const newCollapsed = new Set(prevCollapsed);
      newCollapsed.delete(nodeId);
      console.log(newCollapsed);
      return newCollapsed;
    });
  };

  // Function to handle right-click on nodes
  const handleNodeRightClick = (nodeId) => {
    collapseNodeAndDescendants(nodeId);
  };

  // Function to collapse a node and its descendants
  const collapseNodeAndDescendants = (nodeId) => {
    const graph = graphRef.current;
    const nodesToRemove = new Set();
    const edgesToRemove = new Set();

    // Collect direct children of the node
    graph.forEachOutboundNeighbor(nodeId, (neighbor) => {
      nodesToRemove.add(neighbor);
    });

    // Collect all edges connected to these nodes
    nodesToRemove.forEach((node) => {
      graph.forEachEdge(node, (edgeId, attributes, source, target) => {
        edgesToRemove.add(edgeId);
      });
    });

    // Remove all collected edges and nodes
    edgesToRemove.forEach((edgeId) => {
      if (graph.hasEdge(edgeId)) {
        graph.dropEdge(edgeId);
      }
    });
    nodesToRemove.forEach((node) => {
      if (graph.hasNode(node)) {
        graph.dropNode(node);
      }
    });

    // Add the node and its children to the collapsed nodes set
    setCollapsedNodes((prevCollapsed) => {
      const newCollapsed = new Set(prevCollapsed);
      newCollapsed.add(nodeId);
      nodesToRemove.forEach((node) => newCollapsed.add(node));
      console.log(newCollapsed);
      return newCollapsed;
    });

    // Refresh the graph
    sigma.refresh();
  };

  // Function to add nodes and edges with a delay
  async function addNodesAndEdgesWithDelay(nodes, graph, parentX, parentY, startAngle, angleSpread, radius, edges, level) {
    for (const [index, node] of nodes.entries()) {
      if (collapsedNodes.has(node.id)) continue; // Skip adding collapsed nodes

      const angle = startAngle + (index * angleSpread) / Math.max(1, nodes.length - 1);
      const x = parentX + radius * Math.cos(angle);
      const y = parentY + radius * Math.sin(angle);
      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.label,
          size: 20,
          color: 'black',
          className: 'fade-in', // Apply the fade-in class
          x: x,
          y: y
        });

        // Add node level information
        setNodeLevel((prevNodeLevel) => [
          ...prevNodeLevel,
          { id: node.id, label: node.label, level: level }
        ]);
      }
      await sleep(100); // Wait for 200ms

      // Add edges related to this node
      edges.forEach(edge => {
        if ((edge.source === node.id || edge.target === node.id) && !collapsedNodes.has(edge.source) && !collapsedNodes.has(edge.target)) {
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

  useEffect(() => {
    if (!centralNode.id) return; // Ensure there's an ID
  
    console.log(`Fetching data for central node: ${centralNode.id}`);
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
  
        console.log('Fetched children:', children);
        setParentNodes(parents);
        setChildNodes(children);
        setEdges(defineEdges(data, centralNode.id));
  
        // Remove children from the collapsed nodes set
        setCollapsedNodes((prevCollapsed) => {
          const newCollapsed = new Set(prevCollapsed);
          children.forEach((child) => newCollapsed.delete(child.id));
          console.log('Updated collapsedNodes:', newCollapsed);
          return newCollapsed;
        });
      })
      .catch((error) => {
        console.error('Error fetching data:', error);
      });
  }, [centralNode.id]); // Trigger fetching whenever centralNode.id changes

  // Effect to update graph visualization
  useEffect(() => {
    const graph = graphRef.current; // Use the persistent graph instance

    // Add central node if it doesn't exist
    if (!graph.hasNode(centralNode.id)) {
      graph.addNode(centralNode.id, {
        label: centralNode.label,
        size: 20,
        color: 'black',
        className: 'fade-in', // Apply the fade-in class
        x: centerX,
        y: centerY
      });

      // Add central node level information
      setNodeLevel([{ id: centralNode.id, label: centralNode.label, level: 0 }]);
    }

    // Add parent nodes and edges with delay
    const parentAngleSpread = Math.PI / 2;
    const parentRadius = 100;
    const parentStartAngle = 3 * Math.PI / 4;
    addNodesAndEdgesWithDelay(parentNodes, graph, centerX, centerY, parentStartAngle, parentAngleSpread, parentRadius, edges, 1);

    // Add child nodes and edges with delay
    const childAngleSpread = Math.PI / 2;
    const childRadius = 100;
    const childStartAngle = 7 * Math.PI / 4;
    addNodesAndEdgesWithDelay(childNodes, graph, centerX, centerY, childStartAngle, childAngleSpread, childRadius, edges, 1);

    // Clear any existing click handlers
    sigma.removeAllListeners('clickNode');

    // Set up click handler
    sigma.on('clickNode', (event) => {
      handleNodeClick(event.node);
    });

    // Set up right-click handler
    sigma.on('rightClickNode', (event) => {
      handleNodeRightClick(event.node);
    });

    // Set the graph to Sigma and refresh
    sigma.setGraph(graph);
    sigma.refresh();

    // Cleanup function
    return () => {
      sigma.removeAllListeners('clickNode');
      sigma.removeAllListeners('rightClickNode');
    };
  }, [sigma, parentNodes, childNodes, edges, centralNode, centerX, centerY, collapsedNodes]);

  return <div ref={containerRef} />;
};

const GraphWrapper = () => (
  <SigmaContainer>
    <GraphComponent />
  </SigmaContainer>
);

export default GraphWrapper;
