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
    console.log('API Response:', data); // Log the API response
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
  const sigma = useSigma();
  const graphRef = useRef(new Graph()); // Persistent graph instance
  const [centralNode, setCentralNode] = useState({ id: '', label: '' });
  const [parentNodes, setParentNodes] = useState([]);
  const [childNodes, setChildNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  const [collapsedNodes, setCollapsedNodes] = useState(new Set());
  const [nodeData, setNodeData] = useState(new Map()); // Track node data
  const [firstRun, setFirstRun] = useState(true); // Track if it's the first run

  // Function to manually fade in the node
  const fadeIn = (nodeId) => {
    const graph = graphRef.current; // Access the graph instance
    let opacity = 0;
    const fadeInInterval = setInterval(() => {
      opacity += 0.1; // Increase opacity
      if (opacity >= 1) {
        opacity = 1; // Cap opacity at 1
        clearInterval(fadeInInterval); // Stop the interval when fully opaque
      }
      graph.setNodeAttribute(nodeId, 'color', `rgba(0, 0, 0, ${opacity})`);
    }, 30); // Adjust the interval duration as needed
  };

  // Function to handle node clicks
  const handleNodeClick = (nodeId) => {
    console.log(`Node clicked: ${nodeId}`);
    fetchDataForKey(nodeId)
      .then((data) => {
        const central = data.central[0]; // Assuming central is an array with one element
        setCentralNode({ id: central.id, label: central.label });

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
        setEdges(defineEdges(data, central.id));

        // Remove children from the collapsed nodes set
        setCollapsedNodes((prevCollapsed) => {
          const newCollapsed = new Set(prevCollapsed);
          children.forEach((child) => newCollapsed.delete(child.id));
          console.log('Updated collapsedNodes:', newCollapsed);
          return newCollapsed;
        });
      })
      .catch((error) => {
        console.error('Error fetching data for node click:', error);
      });
  };

  // Function to handle right-click on nodes
  const handleNodeRightClick = (nodeId) => {
    console.log(`Node right-clicked: ${nodeId}`);
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
  async function addNodesAndEdgesWithDelay(nodes, graph, parentX, parentY, startAngle, angleSpread, radius, edges, isRoot = false) {
    const spread = isRoot ? 2 * Math.PI : angleSpread; // 360 degrees for root, 90 degrees for others

    for (const [index, node] of nodes.entries()) {
      if (collapsedNodes.has(node.id)) continue; // Skip adding collapsed nodes

      const angle = startAngle + (index * spread) / (nodes.length);
      const x = parentX + radius * Math.cos(angle);
      const y = parentY + radius * Math.sin(angle);

      // Update nodeData with the new x, y, and angle
      setNodeData((NodeData) => {
        const newNodeData = new Map(NodeData);
        newNodeData.set(node.id, { x, y, angle });
        return newNodeData;
      });

      if (!graph.hasNode(node.id)) {
        graph.addNode(node.id, {
          label: node.label,
          size: 20,
          color: 'rgba(0, 0, 0, 0)',
          x: x,
          y: y
        });
        fadeIn(node.id)
      }
      

      await sleep(100); // Wait for 100ms

      const fadeInEdge = (sourceId, targetId) => {
        const graph = graphRef.current; // Access the graph instance
        let opacity = 0;
        const fadeInInterval = setInterval(() => {
          opacity += 0.1; // Increase opacity
          if (opacity >= 1) {
            opacity = 1; // Cap opacity at 1
            clearInterval(fadeInInterval); // Stop the interval when fully opaque
          }
          graph.setEdgeAttribute(sourceId, targetId, 'color', `rgba(4, 4, 4, ${opacity})`);
        }, 40); // Adjust the interval duration as needed
      };

      // Add edges related to this node
      edges.forEach(edge => {
        if ((edge.source === node.id || edge.target === node.id) && !collapsedNodes.has(edge.source) && !collapsedNodes.has(edge.target)) {
          if (!graph.hasEdge(edge.source, edge.target)) {
            try {
              graph.addEdge(edge.source, edge.target, {
                color: 'rgba(0, 0, 0, 0)' // Start with transparent color
              });
              fadeInEdge(edge.source, edge.target);
            } catch (error) {
              console.warn(`Failed to add edge from ${edge.source} to ${edge.target}:`, error);
            }
          }
        }
      });
      await sleep(50); // Wait for 50ms before adding the next edge
    }
  }

  // Sleep function to pause execution
  function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Data fetching effect
  useEffect(() => {
    if (!centralNode.id) {
      console.log('Central node ID is empty, fetching initial data...');
      fetchDataForKey('Root') 
        .then((data) => {
          const central = data.central[0]; 
          setCentralNode({ id: central.id, label: central.label });

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
          setEdges(defineEdges(data, central.id));

          // Remove children from the collapsed nodes set
          setCollapsedNodes((prevCollapsed) => {
            const newCollapsed = new Set(prevCollapsed);
            children.forEach((child) => newCollapsed.delete(child.id));
            console.log('Updated collapsedNodes:', newCollapsed);
            return newCollapsed;
          });
        })
        .catch((error) => {
          console.error('Error fetching initial data:', error);
        });
    }
  }, [centralNode.id]); // Trigger fetching whenever centralNode.id changes
  
  // Effect to update graph visualization
  useEffect(() => {
    if (!centralNode.id) return; // Ensure centralNode is set

    const graph = graphRef.current; // Use the persistent graph instance


    // Add central node if it doesn't exist
    if (centralNode.id && !graph.hasNode(centralNode.id)) {
      console.log('Adding central node to graph:', centralNode);
      graph.addNode(centralNode.id, {
        label: centralNode.label,
        size: 20,
        color: 'rgba(0, 0, 0, 0)', // Start with transparent color
        x: 0,
        y: 0
      });
      fadeIn(centralNode.id)
    }

    // Add parent nodes and edges with delay
    const parentAngleSpread = Math.PI / 2;
    const parentRadius = 100;
    const parentStartAngle = 3 * Math.PI / 4;
    addNodesAndEdgesWithDelay(parentNodes, graph, 0, 0, parentStartAngle, parentAngleSpread, parentRadius, edges);

    if (firstRun) {
      console.log('First run: true');
      // Add child nodes and edges with delay
      const childAngleSpread = Math.PI * 2; // 360 degrees for the first run
      const childRadius = 100;
      const childStartAngle = 0; // Start angle for 360 degrees
      addNodesAndEdgesWithDelay(childNodes, graph, 0, 0, childStartAngle, childAngleSpread, childRadius, edges, true);

      // Set firstRun to false after the initial rendering
      setFirstRun(false);
    } else {
      console.log('First run: false');
      // Retrieve the parent's angle to calculate the starting angle for children
      const centralNodeInfo = nodeData.get(centralNode.id);
      console.log(centralNodeInfo);
      const centralX = centralNodeInfo.x;
      const centralY = centralNodeInfo.y;
      const centralAngle = centralNodeInfo.angle; 
      const childAngleSpread = Math.PI / 2;
      const childRadius = 170;
      const childStartAngle = centralAngle - (Math.PI / 8); // Start angle based on parent's angle
      addNodesAndEdgesWithDelay(childNodes, graph, centralX, centralY, childStartAngle, childAngleSpread, childRadius, edges);
    }

    // Clear any existing click handlers
    sigma.removeAllListeners('clickNode');

    // Set up click handler
    sigma.on('clickNode', (event) => {
      console.log('Node clicked event:', event);
      handleNodeClick(event.node);
    });

    // Set up right-click handler
    sigma.on('rightClickNode', (event) => {
      console.log('Node right-click event:', event);
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
  }, [sigma, parentNodes, childNodes, edges, centralNode, collapsedNodes]); 

  return <div />;
};

const GraphWrapper = () => (
  <SigmaContainer>
    <GraphComponent />
  </SigmaContainer>
);

export default GraphWrapper;
