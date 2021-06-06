# A Web UI on top of ECK along with an easy k8s-like installation for quick labs
![Intro](https://user-images.githubusercontent.com/43077255/118717509-73713880-b826-11eb-87a8-05ee8e80d0ba.JPG)

Current Version: beta6
https://github.com/Julien01/self-eck-ui/archive/refs/tags/v6.0.0-beta.zip

## Why this project?
The aim of this project was:
- Learn about ECK (Elastic Cloud on Kubernetes)
- Learn Kubernetes basics, ingress, certificates... 
- Being able to spin up a k8s/ECK lab easily (in few commands, even on your laptop)
- Being able to spin up any Elastic 7.x version on ECK with a basic UI

I am sharing it in case it can help someone.  As I said it allowed me to learn a good amount of nice stuffs + it allows me to spin any 7.x versions on Elastic/Kibana/APM easily.

## Disclaimer
I am not a developper, and I don't have the pretention to be one. I am learning how to code on my spare time because I like it and it is quite handy in my day to day work, but I am not a developper. So you might find some inefficient/wrong coding/bugs/etc... As I said previously I am sharing this because I learned a lots of stuff, and it could be quite handy. But for sure don't use it for production.

## Technologies used by this project
- Docker (container technology) used by k3d
- Docker image and registry (dockerhub) used to store self-eck-ui container
- k3d (allow to spin k3s cluster in docker container): https://k3d.io/
- k3s lightweight kubernetes cluster: https://k3s.io/
- Node.js express for backend
- goddady k8s client: https://github.com/godaddy/kubernetes-client for backend
- Vue.js for frontend: https://vuejs.org/
- travis-ci.com for the CI part: For building eck-ui docker image and pushing to docker hub on each git push
- ECK of course ;-) with the wonderfull Elastic Operator: https://github.com/elastic/cloud-on-k8s Note: ECK is used in its free and basic license here.
- nginx ingress, cert-manager

## Explanation
- the self-eck-ui container image contains a backend and a frontend
- backend defines some API routes, which will use the goddady k8s client to spawn elastic resource managed by the ECK operator, and create according k8s nginx ingresses (for elastic, kibana and apm) in order to reach those instances from the outside the cluster.
- frontend will call those API routes

## Installation prerequisites
- OS: Linux/MacOS with 16GB of RAM. The more the better!
- Direct Internet connection without proxy
- Static IP reachable from your workstation. Note: Private or Public IP, both are fine
- TCP Port 443 open
- Install docker for your OS: https://docs.docker.com/get-docker/
- Install Kubectl tool for your OS: https://kubernetes.io/docs/tasks/tools/install-kubectl/

You should have the following output before starting the installation:
```
labuse@ecklab:~$ sudo docker ps -a
CONTAINER ID   IMAGE     COMMAND   CREATED   STATUS    PORTS     NAMES
labuse@ecklab:~$ kubectl
kubectl controls the Kubernetes cluster manager.

 Find more information at: https://kubernetes.io/docs/reference/kubectl/overview/
 ...
 ```

## Install ECK-UI simple install (no custom DNS and no wildcard certificate)
<details>
    <summary>Expand</summary>
    <p>

```
Download latest release: https://github.com/Julien01/self-eck-ui/archive/refs/tags/v6.0.0-beta.zip
unzip self-eck-ui-6.0.0-beta.zip
cd self-eck-ui-6.0.0-beta
sudo chmod +x install.sh
sudo ./install.sh
```

- Installation:
    <details>
    <summary>Expected output</summary>
    <p>

    ```
    labuse@ecklab:~/self-eck-ui$  sudo ./install.sh
    Enter IP: (if you install locally you can use 127.0.0.1 If you install this on remote VM then use its IP)
    static reachable ip: 172.25.110.215
    Enter password for admin UI and admin@eck.ui user:
    Password:  Starting installation.....
    Preparing to install k3d into /usr/local/bin
    k3d installed into /usr/local/bin/k3d
    Run 'k3d --help' to see what you can do with it.
    INFO[0000] Prep: Network
    INFO[0000] Created network 'k3d-k3s-default' (582a9b040577baeed04413dff7c860829ec045c79284d1cccde6bacc018e5767)
    INFO[0000] Created volume 'k3d-k3s-default-images'
    INFO[0001] Creating node 'k3d-k3s-default-server-0'
    INFO[0002] Creating node 'k3d-k3s-default-agent-0'
    INFO[0002] Creating node 'k3d-k3s-default-agent-1'
    INFO[0002] Creating node 'k3d-k3s-default-agent-2'
    INFO[0002] Creating LoadBalancer 'k3d-k3s-default-serverlb'
    INFO[0002] Starting cluster 'k3s-default'
    INFO[0002] Starting servers...
    INFO[0002] Starting Node 'k3d-k3s-default-server-0'
    INFO[0008] Starting agents...
    INFO[0008] Starting Node 'k3d-k3s-default-agent-0'
    INFO[0021] Starting Node 'k3d-k3s-default-agent-1'
    INFO[0028] Starting Node 'k3d-k3s-default-agent-2'
    INFO[0036] Starting helpers...
    INFO[0036] Starting Node 'k3d-k3s-default-serverlb'
    INFO[0037] (Optional) Trying to get IP of the docker host and inject it into the cluster as 'host.k3d.internal' for easy access
    INFO[0039] Successfully added host record to /etc/hosts in 5/5 nodes and to the CoreDNS ConfigMap
    INFO[0039] Cluster 'k3s-default' created successfully!
    INFO[0039] --kubeconfig-update-default=false --> sets --kubeconfig-switch-context=false
    INFO[0039] You can now use it like this:
    kubectl config use-context k3d-k3s-default
    kubectl cluster-info
    namespace/ingress-nginx created
    serviceaccount/ingress-nginx created
    configmap/ingress-nginx-controller created
    clusterrole.rbac.authorization.k8s.io/ingress-nginx created
    clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
    role.rbac.authorization.k8s.io/ingress-nginx created
    rolebinding.rbac.authorization.k8s.io/ingress-nginx created
    service/ingress-nginx-controller-admission created
    service/ingress-nginx-controller created
    deployment.apps/ingress-nginx-controller created
    Warning: admissionregistration.k8s.io/v1beta1 ValidatingWebhookConfiguration is deprecated in v1.16+, unavailable in v1.22+; use admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration
    validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created
    clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission created
    clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
    job.batch/ingress-nginx-admission-create created
    job.batch/ingress-nginx-admission-patch created
    role.rbac.authorization.k8s.io/ingress-nginx-admission created
    rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
    serviceaccount/ingress-nginx-admission created
    namespace/elastic-system created
    serviceaccount/elastic-operator created
    secret/elastic-webhook-server-cert created
    configmap/elastic-operator created
    Warning: apiextensions.k8s.io/v1beta1 CustomResourceDefinition is deprecated in v1.16+, unavailable in v1.22+; use apiextensions.k8s.io/v1 CustomResourceDefinition
    customresourcedefinition.apiextensions.k8s.io/agents.agent.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/apmservers.apm.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/beats.beat.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/elasticsearches.elasticsearch.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/enterprisesearches.enterprisesearch.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/kibanas.kibana.k8s.elastic.co created
    clusterrole.rbac.authorization.k8s.io/elastic-operator created
    clusterrole.rbac.authorization.k8s.io/elastic-operator-view created
    clusterrole.rbac.authorization.k8s.io/elastic-operator-edit created
    clusterrolebinding.rbac.authorization.k8s.io/elastic-operator created
    service/elastic-webhook-server created
    statefulset.apps/elastic-operator created
    Warning: admissionregistration.k8s.io/v1beta1 ValidatingWebhookConfiguration is deprecated in v1.16+, unavailable in v1.22+; use admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration
    validatingwebhookconfiguration.admissionregistration.k8s.io/elastic-webhook.k8s.elastic.co created
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin created
    secret/env-secret created
    deployment.apps/self-eck-admin-ui created
    service/self-eck-admin-ui created
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deployment-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.255.118:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    ingress.extensions/eck-ui-ingress created
    To access admin UI you can connect to https://eck-admin-172-25-110-215.nip.io UserName:admin@eck.ui
    It can take up to 30min to have everything working
    ```
    </p>
    </details>



- [Login(1)](https://user-images.githubusercontent.com/43077255/119314076-93648a00-bc74-11eb-94b7-c229eb7db91b.mp4)
- [Login(2)](https://user-images.githubusercontent.com/43077255/119314147-aecf9500-bc74-11eb-8746-9e8c41e5e14c.mp4)

- [Create a deployment](https://user-images.githubusercontent.com/43077255/119314189-bf800b00-bc74-11eb-82aa-b2baa753cdf4.mp4)

- [Access kibana for a deployment](https://user-images.githubusercontent.com/43077255/119314256-d7f02580-bc74-11eb-9895-3735c6d13144.mp4)

- [Delete deployment](https://user-images.githubusercontent.com/43077255/119314335-ef2f1300-bc74-11eb-87d3-e1c7e86f3d59.mp4)

  </p>
    </details>





## Install ECK-UI With custom dns and wildcard certificate (Possible only if your DNS zone is managed by cloudflare)
<details>
    <summary>Expand</summary>
    <p>
If you own a dns domain and manage your zone on cloudflare, you can use wildcard cert with letsencrypt and DNS01 challenge so (you won't get the certificate warning anymore):
It works only with Cloudflare managed zones for now. You should be able to manage you DNS zone for free with cloudflare (free tier)

```
Download latest release here: https://github.com/Julien01/self-eck-ui/archive/refs/tags/v6.0.0-beta.zip
unzip self-eck-ui-6.0.0-beta.zip
cd self-eck-ui-6.0.0-beta
sudo chmod +x installDNS.sh
sudo ./installDNS.sh
```

- Get your ip:

![ifconfig](https://user-images.githubusercontent.com/43077255/118718697-d8795e00-b827-11eb-8230-32ddcefdc9f4.JPG)


- [Cloudfare API Token creation](https://user-images.githubusercontent.com/43077255/119314408-01a94c80-bc75-11eb-8fff-59629630e056.mp4)

- [Cloudfare A entry and CNAME](https://user-images.githubusercontent.com/43077255/119314568-2f8e9100-bc75-11eb-813b-f20553e32c29.mp4)

- Installation:
    <details>
    <summary>Expected output</summary>
    <p>

    ```
    labuse@ecklab:~/self-eck-ui$ sudo ./installDNS.sh
    Enter WildCard DNS Domain
    DNS Domain: labdemo.myinfra.xyz
    Enter CloudfareAPI:
    API token: 3readacted-oredacted
    Enter Email:
    Email for lets encrypt contact: redacted@gmail.com
    Enter password for admin UI and admin@eck.ui user:
    Password: k3d v4.4.3 is already latest
    Run 'k3d --help' to see what you can do with it.
    INFO[0000] Prep: Network
    INFO[0000] Created network 'k3d-k3s-default' (c083fec56bea2d0186500e60414c4ec56766179c7c62e8b0a4c69bab84daa961)
    INFO[0000] Created volume 'k3d-k3s-default-images'
    INFO[0001] Creating node 'k3d-k3s-default-server-0'
    INFO[0001] Creating node 'k3d-k3s-default-agent-0'
    INFO[0001] Creating node 'k3d-k3s-default-agent-1'
    INFO[0001] Creating node 'k3d-k3s-default-agent-2'
    INFO[0001] Creating LoadBalancer 'k3d-k3s-default-serverlb'
    INFO[0001] Starting cluster 'k3s-default'
    INFO[0001] Starting servers...
    INFO[0001] Starting Node 'k3d-k3s-default-server-0'
    INFO[0011] Starting agents...
    INFO[0011] Starting Node 'k3d-k3s-default-agent-0'
    INFO[0024] Starting Node 'k3d-k3s-default-agent-1'
    INFO[0032] Starting Node 'k3d-k3s-default-agent-2'
    INFO[0040] Starting helpers...
    INFO[0040] Starting Node 'k3d-k3s-default-serverlb'
    INFO[0042] (Optional) Trying to get IP of the docker host and inject it into the cluster as 'host.k3d.internal' for easy access
    INFO[0048] Successfully added host record to /etc/hosts in 5/5 nodes and to the CoreDNS ConfigMap
    INFO[0048] Cluster 'k3s-default' created successfully!
    INFO[0048] --kubeconfig-update-default=false --> sets --kubeconfig-switch-context=false
    INFO[0048] You can now use it like this:
    kubectl config use-context k3d-k3s-default
    kubectl cluster-info
    namespace/ingress-nginx created
    serviceaccount/ingress-nginx created
    configmap/ingress-nginx-controller created
    clusterrole.rbac.authorization.k8s.io/ingress-nginx created
    clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx created
    role.rbac.authorization.k8s.io/ingress-nginx created
    rolebinding.rbac.authorization.k8s.io/ingress-nginx created
    service/ingress-nginx-controller-admission created
    service/ingress-nginx-controller created
    deployment.apps/ingress-nginx-controller created
    Warning: admissionregistration.k8s.io/v1beta1 ValidatingWebhookConfiguration is deprecated in v1.16+, unavailable in v1.22+; use admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration
    validatingwebhookconfiguration.admissionregistration.k8s.io/ingress-nginx-admission created
    clusterrole.rbac.authorization.k8s.io/ingress-nginx-admission created
    clusterrolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
    job.batch/ingress-nginx-admission-create created
    job.batch/ingress-nginx-admission-patch created
    role.rbac.authorization.k8s.io/ingress-nginx-admission created
    rolebinding.rbac.authorization.k8s.io/ingress-nginx-admission created
    serviceaccount/ingress-nginx-admission created
    namespace/elastic-system created
    serviceaccount/elastic-operator created
    secret/elastic-webhook-server-cert created
    configmap/elastic-operator created
    Warning: apiextensions.k8s.io/v1beta1 CustomResourceDefinition is deprecated in v1.16+, unavailable in v1.22+; use apiextensions.k8s.io/v1 CustomResourceDefinition
    customresourcedefinition.apiextensions.k8s.io/agents.agent.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/apmservers.apm.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/beats.beat.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/elasticsearches.elasticsearch.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/enterprisesearches.enterprisesearch.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/kibanas.kibana.k8s.elastic.co created
    clusterrole.rbac.authorization.k8s.io/elastic-operator created
    clusterrole.rbac.authorization.k8s.io/elastic-operator-view created
    clusterrole.rbac.authorization.k8s.io/elastic-operator-edit created
    clusterrolebinding.rbac.authorization.k8s.io/elastic-operator created
    service/elastic-webhook-server created
    statefulset.apps/elastic-operator created
    Warning: admissionregistration.k8s.io/v1beta1 ValidatingWebhookConfiguration is deprecated in v1.16+, unavailable in v1.22+; use admissionregistration.k8s.io/v1 ValidatingWebhookConfiguration
    validatingwebhookconfiguration.admissionregistration.k8s.io/elastic-webhook.k8s.elastic.co created
    customresourcedefinition.apiextensions.k8s.io/certificaterequests.cert-manager.io created
    customresourcedefinition.apiextensions.k8s.io/certificates.cert-manager.io created
    customresourcedefinition.apiextensions.k8s.io/challenges.acme.cert-manager.io created
    customresourcedefinition.apiextensions.k8s.io/clusterissuers.cert-manager.io created
    customresourcedefinition.apiextensions.k8s.io/issuers.cert-manager.io created
    customresourcedefinition.apiextensions.k8s.io/orders.acme.cert-manager.io created
    namespace/cert-manager created
    serviceaccount/cert-manager-cainjector created
    serviceaccount/cert-manager created
    serviceaccount/cert-manager-webhook created
    clusterrole.rbac.authorization.k8s.io/cert-manager-cainjector created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-issuers created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-certificates created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-orders created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-challenges created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim created
    clusterrole.rbac.authorization.k8s.io/cert-manager-view created
    clusterrole.rbac.authorization.k8s.io/cert-manager-edit created
    clusterrole.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io created
    clusterrole.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-cainjector created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-issuers created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-clusterissuers created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-certificates created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-orders created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-challenges created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-ingress-shim created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-controller-approve:cert-manager-io created
    clusterrolebinding.rbac.authorization.k8s.io/cert-manager-webhook:subjectaccessreviews created
    role.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection created
    role.rbac.authorization.k8s.io/cert-manager:leaderelection created
    role.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving created
    rolebinding.rbac.authorization.k8s.io/cert-manager-cainjector:leaderelection created
    rolebinding.rbac.authorization.k8s.io/cert-manager:leaderelection created
    rolebinding.rbac.authorization.k8s.io/cert-manager-webhook:dynamic-serving created
    service/cert-manager created
    service/cert-manager-webhook created
    deployment.apps/cert-manager-cainjector created
    deployment.apps/cert-manager created
    deployment.apps/cert-manager-webhook created
    mutatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook created
    validatingwebhookconfiguration.admissionregistration.k8s.io/cert-manager-webhook created
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin created
    secret/cloudflare-api-token-secret created
    secret/env-secret created
    deployment.apps/self-eck-admin-ui created
    service/self-eck-admin-ui created
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deploymentcert-tmp.yaml": Internal error occurred: failed calling webhook "webhook.cert-manager.io": Post "https://cert-manager-webhook.cert-manager.svc:443/mutate?timeout=10s": dial tcp 10.43.33.191:443: connect: connection refused
    Error from server (InternalError): error when creating "k8s/deploymentcert-tmp.yaml": Internal error occurred: failed calling webhook "webhook.cert-manager.io": Post "https://cert-manager-webhook.cert-manager.svc:443/mutate?timeout=10s": dial tcp 10.43.33.191:443: connect: connection refused
    Error from server (InternalError): error when creating "k8s/deploymentcert-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.103.172:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/cloudflare-api-token-secret configured
    clusterissuer.cert-manager.io/letsencrypt created
    certificate.cert-manager.io/eck-mycert-secret created
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    Error from server (InternalError): error when creating "k8s/deploymentcert-tmp.yaml": Internal error occurred: failed calling webhook "validate.nginx.ingress.kubernetes.io": Post "https://ingress-nginx-controller-admission.ingress-nginx.svc:443/extensions/v1beta1/ingresses?timeout=30s": dial tcp 10.43.103.172:443: connect: connection refused
    retrying it could be normal, indeed depending on the bandwidth, it can take up to 20m,  please be patient...
    clusterrolebinding.rbac.authorization.k8s.io/serviceaccounts-cluster-admin unchanged
    secret/cloudflare-api-token-secret configured
    clusterissuer.cert-manager.io/letsencrypt unchanged
    certificate.cert-manager.io/eck-mycert-secret unchanged
    secret/env-secret configured
    deployment.apps/self-eck-admin-ui unchanged
    service/self-eck-admin-ui unchanged
    Warning: extensions/v1beta1 Ingress is deprecated in v1.14+, unavailable in v1.22+; use networking.k8s.io/v1 Ingress
    ingress.extensions/eck-ui-ingress created
    To access admin UI you can connect to https://eck-admin.labdemo.myinfra.xyz UserName:admin@eck.ui
    It can take up to 30min to have everything working
    ```

    </p>
    </details>



- [Login(1)](https://user-images.githubusercontent.com/43077255/119314736-5ea50280-bc75-11eb-8c66-7c11e682de4d.mp4)
- [Login(2)](https://user-images.githubusercontent.com/43077255/119314807-74b2c300-bc75-11eb-8d2a-9927edbf50a8.mp4)

- Valid Cert:

![cert](https://user-images.githubusercontent.com/43077255/118719098-53427900-b828-11eb-9a06-4cb2c382f3a7.JPG)

- [Create a deployment](https://user-images.githubusercontent.com/43077255/119314189-bf800b00-bc74-11eb-82aa-b2baa753cdf4.mp4)

- [Access kibana for a deployment](https://user-images.githubusercontent.com/43077255/119314256-d7f02580-bc74-11eb-9895-3735c6d13144.mp4)

- [Delete deployment](https://user-images.githubusercontent.com/43077255/119314335-ef2f1300-bc74-11eb-87d3-e1c7e86f3d59.mp4)


    </p>
    </details>

## How to upgrade to beta6
Change the desired version in  `k8s/deployment-upgrade.yaml`
Check the following line:
`image: judu01/self-eck-admin-ui:v20basicbeta6` and change the versionv if needed

Then execute the following:
```
kubectl apply -f https://download.elastic.co/downloads/eck/1.6.0/all-in-one.yaml
kubectl apply -f k8s/deployment-upgrade.yaml
```

## How to use it.
- To access admin UI you can connect to the URL given in the last line of the installation script. For example https://eck-admin-13-69-156-xxx.nip.io.  UserName is admin@eck.ui, password is the one you given in the installation script.
- Enter your deployment name, password for the out of the box elastic user (superuser role), select your version, cluster node count and heapsize and push the create deployment button
- After a while, you will get 3 URL Kibana/Elastic/APM. The kibana one, will allow you to connect to kibana. Login: elastic, password (see the line above). The APM token will be the password you entered as well (see the line above)

## Usefull commands
```
export KUBECONFIG=$(k3d kubeconfig write)
sudo kubectl get elastic --all-namespaces
sudo kubectl get ingresses --all-namespaces
sudo kubectl get pods --all-namespaces
sudo kubectl get services --all-namespaces
```

## Tearing down
```
sudo k3d cluster delete k3s-default
sudo rm $(which k3d)
```

## How to contribute
- `git clone`
- `cd self-eck-ui`
- `npm install`
- define a `.env` file with the following variables:
```
NODE_ENV="development"
INFRA="standalone"
HOSTIP="-127-0-0-1"
DNSWILDCARD="nip.io"
PASSWORD="PASSWORD_PLACE_HOLDER"
SECRET="SECRET_PLACE_HOLDER"
```
Update HOSTIP, PASSWORD, SECRET accordingly.

- create a `k3s.yaml` file to point to your k3s cluster (KUBECONFIG)
-`node index.js`

## Roadmap 
- Add ML nodes
- User Management
- Allow dedicated Node role
- Don't put everything in the default user kub namespace. Maybe one namespace per user or project?
- UI enhancement
- Code review

### DO NOT USE IN PROD! Lab only.
