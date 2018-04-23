// These functions support graphs stored as adjacency matrix

//returns int []
function getAdj(graph, index) {
    let adj = new Array();
    for(let i = 0; i < graph[index].length; i++) {
        if(graph[index][i] > 0) {
            adj.push({to: i, edgeVal: graph[index][i]});
        }
    }
    return adj;
}
// Pass in the {address: String, amount: double, id: int} for node
function getAdjTransaction(graph, transaction) {
    return getAdj(graph, transaction.id);
}

function newGraph(size) {
    let graph = new Array();
    for(let i = 0; i < size; i++) {
        graph.push(new Array());
    }

    for(let i = 0; i < size; i++) {
        for (let j = 0; j < size; j++) {
            graph[i].push(0);
        }
    }

    return graph;
}

function addEdge(graph, from, to) {
    if(from < graph.length && to < graph[from].length) {
        graph[from][to] = 1;
    } else {
        console.log("Attempting to add out of bounds edge")
    }
}

function incrementEdge(graph, from, to) {
    if(from < graph.length && to < graph[from].length) {
        graph[from][to] += 1;
    } else {
        console.log("Attempting to increment out of bounds edge")
    }
}

// Pass in the {address: String, amount: double, id: int} for node
function incrementEdgeTransaction(graph, fromNode, toNode) {
    incrementEdge(graph, fromNode.id, toNode.id);
}

function removeEdge(graph, from, to) {
    if(from < graph.length && to < graph[from].length) {
        graph[from][to] = false;
    } else {
        console.log("Attempting to remove out of bounds edge")
    }
}

// Pass in the {address: String, amount: double, id: int} for node
function addEdgeTransaction(graph, fromNode, toNode) {
    addEdge(graph, fromNode.id, toNode.id);
}
// Pass in the {address: String, amount: double, id: int} for node
function removeEdgeTransaction(graph, fromNode, toNode) {
    removeEdge(graph, fromNode.id, toNode.id);
}


// The goal is to create a graph of transactions that have edges between other transactions that happened on the same day
// Then we can collect all the transactions of location A and all the transactions that happened on the same day
// as transaction A across forever. Then we identify transactions that happen more than once.