exports.neo4j_url = process.env['NEO4J_URL'] || 
					process.env['GRAPHENEDB_URL'] || 
					'http://localhost:7474';

exports.neo4j_auth = process.env['NEO4J_AUTH'] ||
					 process.env['GRAPHENEDB_AUTH'] || 
					 null;