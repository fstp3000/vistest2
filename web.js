var express = require('express');
var app = express();
var path = require('path');
var bodyParser = require('body-parser');
var _ = require("underscore");
var uuid = require("uuid-v4");
var rp = require('request-promise');
var count = 0;
var old_count = 0;

var data = {};
var tmp_data = []

app.use(express.static('public'));
app.use(express.static('node_modules'));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

setInterval(async function htc_api() {
  let options;
  let result;
  let directoryID;
  let EASID;
  console.log('---Update Htc data---');
  try {
    options = {
      method: 'GET',
      uri: 'https://dxdl.deepq.com:5000/entry/count',
      qs: {
	   directoryID: "0xF1b3a932Fd75D15Fe3205De8C7F10224c8228A74",
      }
    };
    res = await rp(options);
		count = parseInt(JSON.parse(res)["result"]["entryCount"]);
		console.log(count);	
		if (count > old_count){
				console.log('Step7:Retrieve a data entry in a directory by entry index');
				try {
						for (i = old_count + 1 ; i < count; i++) {
								options = {
										method: 'GET',
										uri: 'https://dxdl.deepq.com:5000/entry/index',
										qs: {
												directoryID: "0xF1b3a932Fd75D15Fe3205De8C7F10224c8228A74",
												index: i
										}
								};
								res = await rp(options);
								tmp_data.push({"id": i+1, "label": JSON.parse(res)["result"]["dataDescription"]});
								console.log(tmp_data);
								console.log(typeof(tmp_data));
								};
								old_count = count;
				} catch (error) {
						console.log(error.message);
				};
		}
    
  } catch (error) {
    console.log(error.message);
  }
},5000);


function createdata(){
		nodes=[{"id": 0, "label": "repository"}]
		edges=[]
		data= {nodes: nodes,
				  edges: edges, 
				  options:{}
				}
		return true
};

function updatedata(){
		console.log("update");
		old_len = Object.keys(data).length
    len = Object.keys(tmp_data).length
		
		nodes = data.nodes;
		for (i = 0; i < len; i++) { 
				nodes.push({id: tmp_data[i].id , label : tmp_data[i].label})
				console.log(nodes);

		edges= data.edges
		if (edges==undefined){
				edges = [];
		}
		for (i = 0; i < len; i++) { 
				edges.push({id: old_len + i ,from: tmp_data[i].id, to: 0})
				console.log(edges);
		}
		tmp_data=[]
		data = {nodes: nodes,
				  edges: edges, 
				  options:{}
				}
		return true
};
createdata();


app.post('/api/node', function(req, res){
		var newNode = req.body;
		var foundNode = _.find(data.nodes, function(node){
				return node.label === newNode.label
		})

		if (foundNode){
				console.log("I don't find it")
				return;
		}
		data.nodes.push(newNode);
		res.send(newNode).end();
})

app.put('/api/node', function(req, res){
		var updatedNode = req.body;
		var realizeNode;
		_.each(data.nodes, function(node){
				console.log(node.id)
				console.log(updatedNode.id)
				if (node.id == updatedNode.id){
						console.log('match!!')
						node.label = updatedNode.label;
						realizeNode = node;
				}
		});

		res.send(realizeNode).end();

})

app.delete("/api/node", function(req, res){
		var deleteNode = req.body.node;
		var deleteResult = {
				nodes: [],
				edges: []
		};
		var updatedNodes = _.filter(data.nodes, function(node){
				console.log(node.id)
				console.log(deleteNode)
				var keep = (node.id != deleteNode)
				console.log(keep)
				if(!keep){
						deleteResult.nodes.push(node);
				}
				return keep;
		});
		var updatedEdges = _.filter(data.edges, function(edge){
				var keep = (edge.from !== deleteNode) || (edge.to !== deleteNode)
				if(!keep){
						deleteResult.edges.push(edge);
				}
				return keep;
		});
		data.nodes = updatedNodes;
		data.edges = updatedEdges;
		res.send(deleteResult).end();
		});

app.post("/api/edge",function(req, res){
		var newEdge = req.body
		newEdge.id = uuid();
		data.edges.push(newEdge);
		res.send(newEdge).end();
})

app.put("/api/edge", function(req, res){
		var updatedEdge = req.body;
		var realizeEdge;
		_.each(data.edges, function(edge){
				if (edge.label == updatedEdge.label){
						edge.from = updatedEdge.from;
						edge.to = updatedEdge.to;
						realizeEdge = edge;
				}
		});
		res.send(realizeEdge).end()
});

app.delete("/api/edge", function(req, res){
		var deleteEdge = req.body.edge;
		var deleteResult = {
				nodes: [],
				edges: []
		};
		var updatedEdge = _.filter(data.edges, function(edge){
				console.log(edge)
				console.log(edge.id)
				console.log(deleteEdge)
				var keep = (edge.id != deleteEdge)
				console.log(keep)
				if(!keep){
						deleteResult.edges.push(edge);
				}
				return keep;
		});
		data.edges = updatedEdge;
		res.send(deleteResult).end();
		});

app.post('/api/update', function(req, res){
		updatedata(req.body);
		res.send(data).end();
});

app.use('/api', function(req, res){
		res.send(data).end();
});

app.get('/', function(req, res) {
    res.sendFile(path.join(__dirname + '/index.html'));
});


app.listen(9528, function(){
		console.log("Your server was started on port 8080");
});
