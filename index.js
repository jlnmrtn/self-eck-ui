require('dotenv').config();
const express = require('express');
const app = express();
const bodyParser = require('body-parser')
const { KubeConfig } = require('kubernetes-client')
const kubeconfig = new KubeConfig()
const Client = require('kubernetes-client').Client
const Request = require('kubernetes-client/backends/request')
const apmcrd = require('./apm-crd.json')
const elasticcrd = require('./elastic-crd.json')
const kibanacrd = require('./kibana-crd.json')
const path = require('path');
const { result } = require('underscore');
const JSONStream = require('json-stream');
const compression = require('compression');
const minify = require('express-minify');
const uglifyEs = require('uglify-es');
const session = require('express-session');
const exphbs = require('express-handlebars');
const cookieParser = require('cookie-parser');
const crypto = require('crypto');

const getHashedPassword = (password) => {
  const sha256 = crypto.createHash('sha256');
  const hash = sha256.update(password).digest('base64');
  return hash;
}


const userpass = getHashedPassword(process.env.PASSWORD)
const users = [
  // This user is added to the array to avoid creating a new user on each restart
  {
    firstName: 'Admin',
    lastName: 'Eck',
    email: 'admin@eck.ui',
    // This is the SHA256 hash for value of `password`
    password: userpass
  }
];


const generateAuthToken = () => {
  return crypto.randomBytes(30).toString('hex');
}

const requireAuth = (req, res, next) => {
  if (req.user || process.env.NODE_ENV == "development") {
    next();
  } else {
    res.send("login");
  }
};

process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0

app.use(bodyParser.urlencoded({ extended: true }));

// To parse cookies from the HTTP Request
app.use(cookieParser());

app.engine('hbs', exphbs({
  extname: '.hbs'
}));

app.set('view engine', 'hbs');


app.use(compression());
app.use(minify({
  uglifyJsModule: uglifyEs,
  errorHandler: function (errorInfo, callback) {
    console.log(errorInfo);
    if (errorInfo.stage === 'compile') {
      callback(errorInfo.error, JSON.stringify(errorInfo.error));
      return;
    }
    callback(errorInfo.error, errorInfo.body);
  }
}));
app.use(express.static(__dirname + '/views'));



app.use(bodyParser.json())
// set port for the app to listen on
app.set('port', process.env.PORT || 3000);


app.use((req, res, next) => {
  // Get auth token from the cookies
  const authToken = req.cookies['AuthToken'];

  // Inject the user to the request
  req.user = authTokens[authToken];

  next();
});


// enable CORS
app.use(function (req, res, next) {
  res.header("Access-Control-Allow-Origin", "*");
  res.header('Access-Control-Allow-Methods', 'PUT, GET, POST, DELETE, OPTIONS');
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  next();
});

//Getting full URL
app.all("*", function (req, res, next) {  // runs on ALL requests
  req.fullUrl = req.protocol + '://' + req.get('host') + req.originalUrl
  next()
})

app.set('trust proxy', 2);
app.listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});

app.get('/me', requireAuth, (req, res) => {
  res.send(req.user);
});

app.get('/login', (req, res) => {
  res.render('login');
});

app.get('/logout', requireAuth, (req, res) => {
  res.clearCookie('AuthToken');
  res.render('login');
});

const authTokens = {};

app.post('/login', (req, res) => {
  const { email, password } = req.body;
  const hashedPassword = getHashedPassword(password);

  const user = users.find(u => {
    return u.email === email && hashedPassword === u.password
  });

  if (user) {
    const authToken = generateAuthToken();

    // Store authentication token
    authTokens[authToken] = user;

    // Setting the auth token in cookies
    res.cookie('AuthToken', authToken);

    // Redirect user to the protected page
    res.redirect('/');
  } else {
    res.render('login', {
      message: 'Invalid username or password',
      messageClass: 'alert-danger'
    });
  }
});

app.get('/nodes', requireAuth, async (req, res) => {
  try {
    const kubeconfig = new KubeConfig()
    if (process.env.INFRA == "standalone") { kubeconfig.loadFromFile('./k3s.yaml') }
    else { kubeconfig.loadFromCluster() }
    const backend = new Request({ kubeconfig })
    const client = new Client({ backend })
    await client.loadSpec()
    const nodes = await client.api.v1.nodes.get();
    res.send({ kubenodescount: nodes.body.items.length });

  }
  catch (err) {
    console.log(err)
    res.sendStatus(500).send('Issue:' + err);
  }
});

app.get('/list', requireAuth, async (req, res) => {
  try {
    const kubeconfig = new KubeConfig()
    if (process.env.INFRA == "standalone") { kubeconfig.loadFromFile('./k3s.yaml') }
    else { kubeconfig.loadFromCluster() }
    const backend = new Request({ kubeconfig })
    const client = new Client({ backend })
    await client.loadSpec()
    const eses = [];
    const apms = [];
    const kibes = [];
    const inges = [];
    client.addCustomResourceDefinition(apmcrd);
    client.addCustomResourceDefinition(elasticcrd);
    client.addCustomResourceDefinition(kibanacrd);

    const namespaces = await client.api.v1.namespaces.get();

    //get es
    const eslist = await namespaces.body.items.map(async (namespace, i) => {
      const es = await client.apis['elasticsearch.k8s.elastic.co'].v1.namespaces(namespace.metadata.name).elasticsearches.get();
      const esr = await es.body.items.map(async (e) => {
        return {
          ...eses[i],
          elastic: e.metadata.name,
          status: e.status.health || "unknown",
          namespace: namespace.metadata.name,
          availableNodes: e.status.availableNodes,
          phase: e.status.phase,
          version: e.status.version
        };
      })
      return await Promise.all(esr);
    });
    const estemplist = await Promise.all(eslist);
    const esfinallist = [].concat.apply([], estemplist);

    // get apms
    const apmlist = await namespaces.body.items.map(async (namespace, i) => {
      const apm = await client.apis['apm.k8s.elastic.co'].v1.namespaces(namespace.metadata.name).apmservers.get();
      const apmr = await apm.body.items.map(async (a) => {
        return {
          ...apms[i],
          apm: a.metadata.name,
          status: a.status.health || "unknown",
          elasticsearch: a.spec.elasticsearchRef.name,
          namespace: namespace.metadata.name,
          availableNodes: a.status.availableNodes,
          phase: a.status.phase,
          version: a.status.version
        };

      })
      return await Promise.all(apmr);
    });

    const apmtemplist = await Promise.all(apmlist);
    // Array of Array to Array
    const apmfinallist = [].concat.apply([], apmtemplist);

    // get kibanas
    const kiblist = await namespaces.body.items.map(async (namespace, i) => {
      const kib = await client.apis['kibana.k8s.elastic.co'].v1.namespaces(namespace.metadata.name).kibanas.get();
      const kibr = await kib.body.items.map(async (k) => {
        return {
          ...kibes[i],
          kibana: k.metadata.name,
          status: k.status.health || "unknown",
          elasticsearch: k.spec.elasticsearchRef.name,
          namespace: namespace.metadata.name,
          availableNodes: k.status.availableNodes,
          phase: k.status.phase,
          version: k.status.version
        };

      })
      return await Promise.all(kibr);
    });
    //waiting on async call
    const kibtemplist = await Promise.all(kiblist);
    //Array of Array to Array
    const kibfinallist = [].concat.apply([], kibtemplist);


    // get ingresses
    const ingresslist = await namespaces.body.items.map(async (namespace, i) => {
      const ing = await client.apis.extensions.v1beta1.namespaces(namespace.metadata.name).ingresses.get();
      const ingr = await ing.body.items.map(async (k) => {
        return {
          ...inges[i],
          ingress: k.metadata.name,
          namespace: namespace.metadata.name,
          url: k.spec.rules[0].host,
          service: k.spec.rules[0].http.paths[0].backend.serviceName
        };
      })
      return await Promise.all(ingr);
    });
    //waiting on async call
    const ingresstemplist = await Promise.all(ingresslist);

    //res.send(ingresstemplist);
    //Array of Array to Array
    const ingressfinallist = [].concat.apply([], ingresstemplist);


    const deployment = esfinallist.map(e => {
      return {
        elastic: e.elastic,
        status: e.status || "unknown",
        namespace: e.namespace,
        availableNodes: e.availableNodes,
        version: e.version,
        phase: e.phase,
        apm: apmfinallist.filter(a => a.elasticsearch == e.elastic),
        kibana: kibfinallist.filter(k => k.elasticsearch == e.elastic),
        kibanaURL: ingressfinallist.filter(k => k.ingress == "k3s-kib-" + e.elastic + "-ingress"),
        apmURL: ingressfinallist.filter(a => a.ingress == "k3s-apm-" + e.elastic + "-ingress"),
        esURL: ingressfinallist.filter(a => a.ingress == "k3s-es-" + e.elastic + "-ingress")
      }
    })
    res.send(deployment);
  }
  catch (err) {
    console.log(err);
    res.status(500).send('Issue:' + err);
  }
});

app.post('/create', requireAuth, async (req, res) => {
  try {
    const kubeconfig = new KubeConfig()
    if (process.env.INFRA == "standalone") { kubeconfig.loadFromFile('./k3s.yaml') }
    else { kubeconfig.loadFromCluster() }
    const backend = new Request({ kubeconfig })
    const client = new Client({ backend })
    await client.loadSpec()
    client.addCustomResourceDefinition(apmcrd);
    client.addCustomResourceDefinition(elasticcrd);
    client.addCustomResourceDefinition(kibanacrd);
    const createsecret = await client.api.v1.namespaces(req.body.namespace).secrets.post({
      body: {

        "apiVersion": "v1",
        "kind": "Secret",
        "metadata": {
          "name": req.body.name + "-es-elastic-user"
        },
        "type": "Opaque",
        "data": {
          "elastic": req.body.password
        }
      }
    });
    const createelastic = await client.apis['elasticsearch.k8s.elastic.co'].v1.ns(req.body.namespace).elasticsearches.post({
      body: {
        "apiVersion": "elasticsearch.k8s.elastic.co/v1",
        "kind": "Elasticsearch",
        "metadata": {
          "name": req.body.name
        },
        "spec": {
          "version": req.body.version,
          "nodeSets": [
            {
              "name": "all",
              "count": req.body.nodecount,
              "config": {
                "node.data": true,
                "node.ingest": true,
                "node.master": true
              },
              "podTemplate": {
                "spec": {
                  "containers": [
                    {
                      "name": "elasticsearch",
                      "env": [
                        {
                          "name": "ES_JAVA_OPTS",
                          "value": "-Xms" + req.body.heapsize + "g -Xmx" + req.body.heapsize + "g"
                        }
                      ]
                    }
                  ]
                }
              }
            }
          ]
        }
      }
    });

    //create kibana
    const createkibana = await client.apis['kibana.k8s.elastic.co'].v1.ns(req.body.namespace).kibanas.post({
      body: {
        "apiVersion": "kibana.k8s.elastic.co/v1",
        "kind": "Kibana",
        "metadata": {
          "name": req.body.name
        },
        "spec": {
          "version": req.body.version,
          "count": 2,
          "elasticsearchRef": {
            "name": req.body.name,
            "namespace": "default"
          }
        }
      }
    });

    //create APM secret
    const createapmsecret = await client.api.v1.namespaces(req.body.namespace).secrets.post({
      body: {

        "apiVersion": "v1",
        "kind": "Secret",
        "metadata": {
          "name": req.body.name + "-apm-token",
          "labels": {
            "apm.k8s.elastic.co/name": req.body.name,
            "common.k8s.elastic.co/type": "apm-server"
          }
        },
        "type": "Opaque",
        "data": {
          "secret-token": req.body.password
        }
      }
    });

    //create APM
    const createapm = await client.apis['apm.k8s.elastic.co'].v1.ns(req.body.namespace).apmservers.post({
      body: {
        "apiVersion": "apm.k8s.elastic.co/v1",
        "kind": "ApmServer",
        "metadata": {
          "name": req.body.name
        },
        "spec": {
          "version": req.body.version,
          "count": 2,
          "elasticsearchRef": {
            "name": req.body.name,
            "namespace": "default"
          }
        }
      }
    });


    //create kibana ingress
    const createkibanaingress = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses.post({
      body: {
        "apiVersion": "extensions/v1beta1",
        "kind": "Ingress",
        "metadata": {
          "name": "k3s-kib-" + req.body.name + "-ingress",
          "namespace": "default",
          "annotations": {
            "kubernetes.io/ingress.class": "nginx",
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS"
          }
        },
        "spec": {
          "tls": [
            {
              "secretName": "eck-mycert-secret",
              "hosts": [
                req.body.name + "-kib" + process.env.HOSTIP + "." + process.env.DNSWILDCARD
              ]
            }
          ],
          "rules": [
            {
              "host": req.body.name + "-kib" + process.env.HOSTIP + "." + process.env.DNSWILDCARD,
              "http": {
                "paths": [
                  {
                    "path": "/",
                    "backend": {
                      "serviceName": req.body.name + "-kb-http",
                      "servicePort": 5601
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    });

    //APM ingress
    const createapmingress = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses.post({
      body: {
        "apiVersion": "extensions/v1beta1",
        "kind": "Ingress",
        "metadata": {
          "name": "k3s-apm-" + req.body.name + "-ingress",
          "namespace": "default",
          "annotations": {
            "kubernetes.io/ingress.class": "nginx",
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS"
          }
        },
        "spec": {
          "tls": [
            {
              "secretName": "eck-mycert-secret",
              "hosts": [
                req.body.name + "-apm" + process.env.HOSTIP + "." + process.env.DNSWILDCARD
              ]
            }
          ],
          "rules": [
            {
              "host": req.body.name + "-apm" + process.env.HOSTIP + "." + process.env.DNSWILDCARD,
              "http": {
                "paths": [
                  {
                    "path": "/",
                    "backend": {
                      "serviceName": req.body.name + "-apm-http",
                      "servicePort": 8200
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    });


    //ES ingress
    const createesingress = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses.post({
      body: {
        "apiVersion": "extensions/v1beta1",
        "kind": "Ingress",
        "metadata": {
          "name": "k3s-es-" + req.body.name + "-ingress",
          "namespace": "default",
          "annotations": {
            "kubernetes.io/ingress.class": "nginx",
            "nginx.ingress.kubernetes.io/backend-protocol": "HTTPS"
          }
        },
        "spec": {
          "tls": [
            {
              "secretName": "eck-mycert-secret",
              "hosts": [
                req.body.name + "-es" + process.env.HOSTIP + "." + process.env.DNSWILDCARD
              ]
            }
          ],
          "rules": [
            {
              "host": req.body.name + "-es" + process.env.HOSTIP + "." + process.env.DNSWILDCARD,
              "http": {
                "paths": [
                  {
                    "path": "/",
                    "backend": {
                      "serviceName": req.body.name + "-es-http",
                      "servicePort": 9200
                    }
                  }
                ]
              }
            }
          ]
        }
      }
    });
    res.send("OK");
  }
  catch (err) {
    res.sendStatus(503).send('Issue:' + err);
  }
});


app.post('/update', requireAuth, async (req, res) => {
  try {
    const kubeconfig = new KubeConfig()
    if (process.env.INFRA == "standalone") { kubeconfig.loadFromFile('./k3s.yaml') }
    else { kubeconfig.loadFromCluster() }
    const backend = new Request({ kubeconfig })
    const client = new Client({ backend })
    await client.loadSpec()
    client.addCustomResourceDefinition(apmcrd);
    client.addCustomResourceDefinition(elasticcrd);
    client.addCustomResourceDefinition(kibanacrd);
    const eses = [];
    const kibes = [];
    const apms = [];

    //update elastic 

    const eslist = await client.apis['elasticsearch.k8s.elastic.co'].v1.namespaces(req.body.namespace).elasticsearches.get();
    const esr = await eslist.body.items.map(async (e, i) => {
      return {
        ...eses[i],
        elastic: e.metadata.name,
        status: e.status.health,
        resourceVersion: e.metadata.resourceVersion
      };
    });
    const estemplist = await Promise.all(esr);
    const esfinallist = [].concat.apply([], estemplist);
    const es = esfinallist.filter(e => e.elastic == req.body.name);

    const updateelastic = await client.apis['elasticsearch.k8s.elastic.co'].v1.ns(req.body.namespace).elasticsearches(req.body.name).put({
      body: {
        "apiVersion": "elasticsearch.k8s.elastic.co/v1",
        "kind": "Elasticsearch",
        "metadata": {
          "annotations": {
            "common.k8s.elastic.co/controller-version": "1.3.0"
          },
          "name": req.body.name,
          "resourceVersion": es[0].resourceVersion
        },
        "spec": {
          "version": req.body.version,
          "nodeSets": [
            {
              "name": "all",
              "count": req.body.nodecount,
              "config": {
                "node.data": true,
                "node.ingest": true,
                "node.master": true
              }
            }
          ]
        }
      }
    });

    //update kibana
    const kiblist = await client.apis['kibana.k8s.elastic.co'].v1.namespaces(req.body.namespace).kibanas.get();
    const ksr = await kiblist.body.items.map(async (e, i) => {
      return {
        ...kibes[i],
        kibana: e.metadata.name,
        status: e.status.health,
        resourceVersion: e.metadata.resourceVersion
      };
    });
    const kibtemplist = await Promise.all(ksr);
    const kibfinallist = [].concat.apply([], kibtemplist);
    const kib = kibfinallist.filter(e => e.kibana == req.body.name);

    const updatekibana = await client.apis['kibana.k8s.elastic.co'].v1.ns(req.body.namespace).kibanas(req.body.name).put({
      body: {
        "apiVersion": "kibana.k8s.elastic.co/v1",
        "kind": "Kibana",
        "metadata": {
          "annotations": {
            "common.k8s.elastic.co/controller-version": "1.3.0"
          },
          "name": req.body.name,
          "resourceVersion": kib[0].resourceVersion
        },
        "spec": {
          "version": req.body.version,
          "count": 2,
          "elasticsearchRef": {
            "name": req.body.name,
            "namespace": "default"
          }
        }
      }
    });

    //update APM
    const apmlist = await client.apis['apm.k8s.elastic.co'].v1.namespaces(req.body.namespace).apmservers.get();
    const asr = await apmlist.body.items.map(async (e, i) => {
      return {
        ...apms[i],
        apm: e.metadata.name,
        status: e.status.health,
        resourceVersion: e.metadata.resourceVersion
      };
    });
    const apmtemplist = await Promise.all(asr);
    const apmfinallist = [].concat.apply([], apmtemplist);
    const apm = apmfinallist.filter(e => e.apm == req.body.name);
    const updateapm = await client.apis['apm.k8s.elastic.co'].v1.ns(req.body.namespace).apmservers(req.body.name).put({
      body: {
        "apiVersion": "apm.k8s.elastic.co/v1",
        "kind": "ApmServer",
        "metadata": {
          "annotations": {
            "common.k8s.elastic.co/controller-version": "1.3.0"
          },
          "name": req.body.name,
          "resourceVersion": apm[0].resourceVersion
        },
        "spec": {
          "version": req.body.version,
          "count": 2,
          "elasticsearchRef": {
            "name": req.body.name,
            "namespace": "default"
          }
        }
      }
    });
    res.send("OK");
  }
  catch (err) {
    res.status(500).send('Issue:' + err);
  }
});


app.post('/delete', requireAuth, async (req, res) => {
  try {
    const kubeconfig = new KubeConfig()
    if (process.env.INFRA == "standalone") { kubeconfig.loadFromFile('./k3s.yaml') }
    else { kubeconfig.loadFromCluster() }
    const backend = new Request({ kubeconfig })
    const client = new Client({ backend })
    await client.loadSpec()
    client.addCustomResourceDefinition(apmcrd);
    client.addCustomResourceDefinition(elasticcrd);
    client.addCustomResourceDefinition(kibanacrd);

    const deleteelastic = await client.apis['elasticsearch.k8s.elastic.co'].v1.ns(req.body.namespace).elasticsearches(req.body.name).delete();
    const deletekibana = await client.apis['kibana.k8s.elastic.co'].v1.ns(req.body.namespace).kibanas(req.body.name).delete();
    const deleteapm = await client.apis['apm.k8s.elastic.co'].v1.ns(req.body.namespace).apmservers(req.body.name).delete();
    const deleteseingresses = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses("k3s-es-" + req.body.name + "-ingress").delete();
    const deletkibeingresses = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses("k3s-kib-" + req.body.name + "-ingress").delete();
    const deletapmingresses = await client.apis.extensions.v1beta1.namespaces(req.body.namespace).ingresses("k3s-apm-" + req.body.name + "-ingress").delete();

    res.send("OK");
  } catch (err) {
    res.status(500).send('Issue:' + err);
  }
});