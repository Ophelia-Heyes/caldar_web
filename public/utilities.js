
const shortestDistanceNode = (distances, visited) => {
  let shortest = null;

  for (let node in distances) {
    let currentIsShortest =
      shortest === null || distances[node] < distances[shortest];
    if (currentIsShortest && !visited.includes(node)) {
      shortest = node;
    }
  }
  return shortest;
};

const findShortestPath = (graph, startNode, endNode) => {
  // establish object for recording distances from the start node
  let distances = {};
  distances[endNode] = "Infinity";
  distances = Object.assign(distances, graph[startNode]);

  // track paths
  let parents = { endNode: null };
  for (let child in graph[startNode]) {
    parents[child] = startNode;
  }

  // track nodes that have already been visited
  let visited = [];

  // find the nearest node
  let node = shortestDistanceNode(distances, visited);

  // for that node
  while (node) {
    // find its distance from the start node & its child nodes
    let distance = distances[node];
    let children = graph[node];
    // for each of those child nodes
    for (let child in children) {
      // make sure each child node is not the start node
      if (String(child) === String(startNode)) {
        //console.log("don't return to the start node! 🙅");
        continue;
      } else {
        //console.log("startNode: " + startNode);
        //console.log("distance from node " + parents[node] + " to node " + node + ")");
        //console.log("previous distance: " + distances[node]);
        // save the distance from the start node to the child node
        let newdistance = distance + children[child];
        //console.log("new distance: " + newdistance);
        // if there's no recorded distance from the start node to the child node in the distances object
        // or if the recorded distance is shorter than the previously stored distance from the start node to the child node
        // save the distance to the object
        // record the path
        if (!distances[child] || distances[child] > newdistance) {
          distances[child] = newdistance;
          parents[child] = node;
          //console.log("distance + parents updated");
        } else {
          //console.log("not updating, because a shorter path already exists!");
        }
      }
    }
    // move the node to the visited set
    visited.push(node);
    // move to the nearest neighbor node
    node = shortestDistanceNode(distances, visited);
  }

  // using the stored paths from start node to end node
  // record the shortest path
  let shortestPath = [endNode];
  let parent = parents[endNode];
  while (parent) {
    shortestPath.push(parent);
    parent = parents[parent];
  }
  shortestPath.reverse();

  // return the shortest path from start node to end node & its distance
  let results = {
    distance: distances[endNode],
    path: shortestPath,
  };

  return results;
};

function generateDelaunayShortestPath(start, end) {
  // filter out every third point to get 2d array
  let points2d = rawPts.filter((e, i) => (i+1) % 3 != 0);
  let neighbors = {};
  let delaunay = new Delaunator(points2d);
  //measure each length
  for (let i = 0; i < numPoints; i++) {
    neighbors[i] = {};
  }
  for (let i = 0; i < delaunay.triangles.length; i++) {
    if ((i+1)%3!=0)
    {
    p1 = delaunay.triangles[i];
    p2 = delaunay.triangles[i + 1];
    // get length of connection
    l = dist(
      points2d[p1 * 2],
      points2d[p1 * 2 + 1],
      points2d[p2 * 2],
      points2d[p2 * 2 + 1]
    );
      neighbors[p1][p2] = l;
      neighbors[p2][p1] = l;
    }
  }
  return findShortestPath(neighbors, start, end);
}

function pointOnLine(pt, l1, l2) {
  lineDir = p5.Vector.sub(l2, l1).normalize();
  pRelative = p5.Vector.sub(pt, l1);
  distance = lineDir.dot(pRelative);

  return p5.Vector.add(l1, p5.Vector.mult(lineDir, distance));
}

function pointOnLineSegment(pt, l1, l2) {
  lineDir = p5.Vector.sub(l2, l1).normalize();
  pRelative = p5.Vector.sub(pt, l1);
  distance = lineDir.dot(pRelative);
  linePt = p5.Vector.add(l1, p5.Vector.mult(lineDir, distance));
  dotProduct = p5.Vector.dot(p5.Vector.sub(l2, l1), p5.Vector.sub(linePt, l1));
  isOnSeg = dotProduct > 0 && dotProduct < p5.Vector.sub(l2, l1).magSq();

  return isOnSeg ? linePt : (p5.Vector.sub(pt, l1).magSq() < p5.Vector.sub(pt, l2).magSq()) ? l1 : l2;
}

// Easing Functions

function easeInSine(x)
{
  return 1 - Math.cos((x * Math.PI)/2);
}