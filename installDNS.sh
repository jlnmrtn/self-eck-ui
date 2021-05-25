#!/bin/bash

GREEN=$(tput setaf 2)
RESET=$(tput sgr0)
RED=$(tput setaf 1)
cp k8s/deploymentcert.yaml k8s/deploymentcert-tmp.yaml
echo -e "Enter WildCard DNS Domain"
read -p 'DNS Domain: ' dnsdomain
echo "Enter CloudfareAPI:"
read -p 'API token: ' cftoken
echo "Enter Email:"
read -p 'Email for lets encrypt contact: ' email
echo "Enter password for admin UI and admin@eck.ui user:"
read -sp 'Password: ' pass
echo -e '\n'
echo -e ${GREEN}"Starting installation....."${RESET}
echo "vm.max_map_count=262144" >> /etc/sysctl.conf
set="abcdefghijklmonpqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789"
n=32
rand=""
for i in `seq 1 $n`; do
    char=${set:$RANDOM % ${#set}:1}
    rand+=$char
done
sysctl -w vm.max_map_count=262144 >/dev/null 2>&1
sed -i -e "s/PASSWORD_PLACE_HOLDER/$pass/g" k8s/deploymentcert-tmp.yaml
sed -i -e "s/SECRET_PLACE_HOLDER/$rand/g" k8s/deploymentcert-tmp.yaml
sed -i -e "s/DNS_PLACE_HOLDER/$dnsdomain/g" k8s/deploymentcert-tmp.yaml
sed -i -e "s/EMAIL_PLACE_HOLDER/$email/g" k8s/deploymentcert-tmp.yaml
sed -i -e "s/TOKEN_PLACE_HOLDER/$cftoken/g" k8s/deploymentcert-tmp.yaml
curl -s https://raw.githubusercontent.com/rancher/k3d/main/install.sh | bash
k3d cluster create  --k3s-server-arg "--no-deploy=traefik" --agents=3 -p "443:443@loadbalancer"
kubectl apply -f https://raw.githubusercontent.com/kubernetes/ingress-nginx/controller-0.32.0/deploy/static/provider/cloud/deploy.yaml
kubectl apply -f https://download.elastic.co/downloads/eck/1.6.0/all-in-one.yaml
kubectl apply -f https://github.com/jetstack/cert-manager/releases/download/v1.3.1/cert-manager.yaml
kubectl apply -f k8s/deploymentcert-tmp.yaml
while [ $? -ne 0 ]; do
    echo -e ${RED}"retrying as this error could be normal, indeed depending on the bandwidth it can take up to 20m,  please be patient..."${RESET}
    sleep 30
    kubectl apply -f k8s/deploymentcert-tmp.yaml
done
mv k8s/deploymentcert-tmp.yaml k8s/deploymentcert-upgrade.yaml
echo -e ${GREEN}"To access admin UI you can connect to https://eck-admin.$dnsdomain UserName:admin@eck.ui"${RESET}
echo "It can take up to 30min to have everything working"
