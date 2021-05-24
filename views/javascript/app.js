var app = new Vue({
    el: '#app',
    data: {
        fetching: false,
        updateStarted: ``,
        hasDeleted: false,
        instanceToDelete: '',
        forbidden: true,
        initialLoad: true,
        kubenodecount: '',
        heapsize: '',
        isHidden: false,
        results: [],
        lists: [],
        update: false,
        esdeployment: '',
        updateVersion: '',
        updateNodeCount: 0,
        counter: 30,
        query: '',
        url: '',
        username: '',
        appVersion: 'beta4',
        versions: [
            "7.12.1", "7.12.0", "7.11.2", "7.11.1", "7.10.2", "7.10.1", "7.10.0", "7.9.3", "7.8.0", "7.7.0", "7.6.0"
        ],
        heapsizes: [1, 2, 4, 8, 12, 16],
        nodecounts: [1, 2, 3],
        deployment: {
            name: '',
            version: '',
            password: '',
            nodecount: '',
            namespace: 'default',
            heapsize: '',
        }
    },


    // declare methods in this Vue component.         
    methods: {
        addDeployment: async function () {
            this.counter = 30;
            this.deployment.password = btoa(this.deployment.password);
            this.isHidden = true;
            const res = await axios.post("/create", this.deployment)
            this.deployment.name = '';
            this.deployment.password = '';
            this.deployment.version = '';
            this.deployment.nodecount = '';
            this.deployment.heapsize = '';
        },

        deleteDeployment: function (a, b) {
            this.instanceToDelete = a;
            this.countDown = 0;
            this.hasDeleted = true;
            axios.post("/delete", { name: a, namespace: b })
                .then(function (response) {
                    app.list();
                })
                .catch(function (error) {
                    console.log(error);
                });
        },

        getURL: function (a) {
            this.url = a;
        },

        updateButton: function (a) {
            this.esdeployment = a;
            this.update = true;
        },


        updateDeployment: async function (a, b, c, d) {
            var integer = parseInt(d, 10);
            const res = await axios.post("/update", { name: a, namespace: b, version: c, nodecount: integer })
            this.update = false
            this.updateStarted = a
        },


        getURL: function (a) {
            this.url = a;
        },

        list: async function () {
            this.updateStarted = ''
            this.isHidden = false;
            if (this.counter <= 2 || this.initialLoad) {
                this.fetching = true;
                this.counter = 30;
                const res = await axios.get("/list")
                    .then(response => {
                        this.fetching = false;
                        if (response.data == "login") {
                            window.location.href = "/login";
                        }
                        else {
                            this.hasDeleted = false;
                            this.lists = response.data;
                            this.initialLoad = false;
                        }
                    })
                    .catch(function (error) {
                        this.fetching = false;
                        this.counter = 30;
                        console.log(error);
                    })
            }
        },

        logout: function () {
            console.log('logout'),
                axios.get("/logout")
                    .then(response => {
                        window.location.href = "/logout";
                    })
                    .catch(function (error) {
                        console.log(error);
                    })

        },

        login: function () {
            axios.get("/auth")
                .then(response => {
                    if (response.data.redirect) {

                        window.location.href = response.data.redirect;
                    }
                    else {
                        this.results = response.data;
                    }
                })
                .catch(function (error) {
                    console.log(error);
                })

        },

        intervalFetchData: function () {
            setInterval(() => {
                this.counter--
                if (this.counter === 0) {
                    this.list();
                }
            }, 1000);
        },


        kubeDetails: function () {
            axios.get("/nodes")
                .then(response => {
                    if (response.data.redirect) {
                        window.location.href = response.data.redirect;
                    }
                    else {
                        this.kubenodecount = response.data.kubenodescount;
                    }
                })
                .catch(function (error) {

                    console.log(error);
                })
        },


        whoami: function () {
            axios.get("/me")
                .then(response => {
                    if (response.data.redirect) {
                        window.location.href = response.data.redirect;
                    }
                    else {
                        this.username = response.data.email;
                    }
                })
                .catch(function (error) {
                    window.location.href = "/";
                    console.log(error);
                })
        },
    },

    // declare Vue watchers
    watch: {
        // watch for change in the query string and recall the search method
        query: function () {
            this.search();
        }
    },

    mounted() {
        this.intervalFetchData();
    },

    beforeMount() {
        this.whoami();
        this.list();
        this.kubeDetails();
    },
})