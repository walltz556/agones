---
title: "Quickstart: Create a Fleet Autoscaler"
linkTitle: "Create a Fleetautoscaler"
date: 2019-01-02T06:42:33Z
description: >
  This guide covers how you can quickly get started using Agones to create a Fleet 
  Autoscaler to manage your fleet size automatically, based on actual load.
weight: 30  
---

## Prerequisites

It is assumed that you have followed the instructions to [Create a Game Server Fleet]({{< ref "create-fleet.md" >}})
and you have a running fleet of game servers. 

## Objectives

- Create a Fleet Autoscaler in Kubernetes using Agones custom resource.
- Watch the Fleet scale up when allocating GameServers
- Watch the Fleet scale down when shutting down allocated GameServers
- Edit the autoscaler specification to apply live changes

### 1. Create a Fleet Autoscaler

Let's create a Fleet Autoscaler using the following command : 

```
kubectl apply -f https://raw.githubusercontent.com/googleforgames/agones/{{< release-branch >}}/examples/simple-udp/fleetautoscaler.yaml
```

You should see a successful output similar to this :

```
fleetautoscaler.autoscaling.agones.dev "simple-udp-autoscaler" created
```

This has created a FleetAutoscaler record inside Kubernetes.

### 2. See the autoscaler status.

```
kubectl describe fleetautoscaler simple-udp-autoscaler
``` 

It should look something like this:

{{% feature expiryVersion="0.12.0" %}}
```
Name:         simple-udp-autoscaler
Namespace:    default
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"au
toscaling.agones.dev/v1alpha1","kind":"FleetAutoscaler","metadata":{"annotations
":{},"name":"simple-udp-autoscaler","namespace":"default"},...
API Version:  autoscaling.agones.dev/v1alpha1
Kind:         FleetAutoscaler
Metadata:
  Cluster Name:
  Creation Timestamp:  2018-10-02T15:19:58Z
  Generation:          1
  Owner References:
    API Version:           autoscaling.agones.dev/v1alpha1
    Block Owner Deletion:  true
    Controller:            true
    Kind:                  Fleet
    Name:                  simple-udp
    UID:                   9960762e-c656-11e8-933e-fa163e07a1d4
  Resource Version:        6123197
  Self Link:               /apis/autoscaling.agones.dev/v1alpha1/namespaces/default/f
leetautoscalers/simple-udp-autoscaler
  UID:                     9fd0efa1-c656-11e8-933e-fa163e07a1d4
Spec:
  Fleet Name:  simple-udp
  Policy:
    Buffer:
      Buffer Size:   2
      Max Replicas:  10
      Min Replicas:  2
    Type:            Buffer
Status:
  Able To Scale:     true
  Current Replicas:  2
  Desired Replicas:  2
  Last Scale Time:   <nil>
  Scaling Limited:   false
Events:              <none>
```
{{% /feature %}}
{{% feature publishVersion="0.12.0" %}}
```
Name:         simple-udp-autoscaler
Namespace:    default
Labels:       <none>
Annotations:  kubectl.kubernetes.io/last-applied-configuration={"apiVersion":"au
toscaling.agones.dev/v1","kind":"FleetAutoscaler","metadata":{"annotations":{},
"name":"simple-udp-autoscaler","namespace":"default"},...
API Version:  autoscaling.agones.dev/v1
Kind:         FleetAutoscaler
Metadata:
  Cluster Name:
  Creation Timestamp:  2018-10-02T15:19:58Z
  Generation:          1
  Owner References:
    API Version:           autoscaling.agones.dev/v1
    Block Owner Deletion:  true
    Controller:            true
    Kind:                  Fleet
    Name:                  simple-udp
    UID:                   9960762e-c656-11e8-933e-fa163e07a1d4
  Resource Version:        6123197
  Self Link:               /apis/autoscaling.agones.dev/v1/namespaces/default/f
leetautoscalers/simple-udp-autoscaler
  UID:                     9fd0efa1-c656-11e8-933e-fa163e07a1d4
Spec:
  Fleet Name:  simple-udp
  Policy:
    Buffer:
      Buffer Size:   2
      Max Replicas:  10
      Min Replicas:  2
    Type:            Buffer
Status:
  Able To Scale:     true
  Current Replicas:  2
  Desired Replicas:  2
  Last Scale Time:   <nil>
  Scaling Limited:   false
Events:              <none>
```
{{% /feature %}}

You can see the status (able to scale, not limited), the last time the fleet was scaled (nil for never)
and the current and desired fleet size. 

The autoscaler works by changing the desired size, and the fleet creates/deletes game server instances
to achieve to that number. The convergence is achieved in time, which is usually measured in seconds.

### 3. Allocate a Game Server from the Fleet 

If you're interested in more details for game server allocation, you should consult the [Create a Game Server Fleet]({{< ref "create-fleet.md" >}}) page.
In here we are only interested in triggering allocations to see the autoscaler in action.

```
kubectl create -f https://raw.githubusercontent.com/googleforgames/agones/{{< release-branch >}}/examples/simple-udp/gameserverallocation.yaml -o yaml
```

You should get in return the allocated game server details, which should end with something like:
```
status:
  address: 34.94.118.237
  gameServerName: simple-udp-v6jwb-6bzkz
  nodeName: gke-test-cluster-default-f11755a7-5km3
  ports:
  - name: default
    port: 7832
  state: Allocated
```

Note the address and port, you might need them later to connect to the server.

### 4. See the autoscaler in action

Now let's wait a few seconds to allow the autoscaler to detect the change in the fleet and check again its status

```
kubectl describe fleetautoscaler simple-udp-autoscaler
``` 

The last part should look something like this:

```
Spec:
  Fleet Name:  simple-udp
  Policy:
    Buffer:
      Buffer Size:   2
      Max Replicas:  10
      Min Replicas:  2
    Type:            Buffer
Status:
  Able To Scale:     true
  Current Replicas:  3
  Desired Replicas:  3
  Last Scale Time:   2018-10-02T16:00:02Z
  Scaling Limited:   false
Events:
  Type    Reason            Age   From                        Message
  ----    ------            ----  ----                        -------
  Normal  AutoScalingFleet  2m    fleetautoscaler-controller  Scaling fleet simple-udp from 2 to 3
```

You can see that the fleet size has increased, the autoscaler having compensated for the allocated instance.
Last Scale Time has been updated, and a scaling event has been logged.

Double-check the actual number of game server instances and status by running

```
kubectl get gs
``` 

This will get you a list of all the current `GameServers` and their `Status > State`.

```
NAME                     STATE       ADDRESS        PORT     NODE        AGE
simple-udp-mzhrl-hz8wk   Allocated   10.30.64.99    7131     minikube    5m
simple-udp-mzhrl-k6jg5   Ready       10.30.64.100   7243     minikube    5m  
simple-udp-mzhrl-n2sk2   Ready       10.30.64.168   7658     minikube    5m
``` 

### 5. Shut the allocated instance down

Since we've only got one allocation, we'll just grab the details of the IP and port of the
only allocated `GameServer`: 

```
kubectl get gameservers | grep Allocated | awk '{print $3":"$4 }'
```

This should output your Game Server IP address and port. (eg `10.130.65.208:7936`)

You can now communicate with the `GameServer`:

```
nc -u {IP} {PORT}
Hello World !
ACK: Hello World !
EXIT
```

You can finally type `EXIT` which tells the SDK to run the [Shutdown command]({{< ref "/docs/Guides/Client SDKs/_index.md#shutdown" >}}), and therefore shuts down the `GameServer`.  
 
### 6. See the fleet scaling down

Now let's wait a few seconds to allow the autoscaler to detect the change in the fleet and check again its status

```
kubectl describe fleetautoscaler simple-udp-autoscaler
``` 

It should look something like this:

```
Spec:
  Fleet Name:  simple-udp
  Policy:
    Buffer:
      Buffer Size:   2
      Max Replicas:  10
      Min Replicas:  2
    Type:            Buffer
Status:
  Able To Scale:     true
  Current Replicas:  3
  Desired Replicas:  2
  Last Scale Time:   2018-10-02T16:09:02Z
  Scaling Limited:   false
Events:
  Type    Reason            Age   From                        Message
  ----    ------            ----  ----                        -------
  Normal  AutoScalingFleet  9m    fleetautoscaler-controller  Scaling fleet simple-udp from 2 to 3
  Normal  AutoScalingFleet  45s   fleetautoscaler-controller  Scaling fleet simple-udp from 3 to 2
```

You can see that the fleet size has decreased, the autoscaler adjusting to game server instance being de-allocated,
the Last Scale Time and the events have been updated. Note that simple-udp game server instance you just closed earlier
might stay a bit in 'Unhealthy' state (and its pod in 'Terminating' until it gets removed.

Double-check the actual number of game server instances and status by running

```
kubectl get gs
``` 

This will get you a list of all the current `GameServers` and their `Status > State`.

```
NAME                     STATE     ADDRESS        PORT    NODE       AGE
simple-udp-mzhrl-k6jg5   Ready     10.30.64.100   7243    minikube   5m
simple-udp-mzhrl-t7944   Ready     10.30.64.168   7561    minikube   5m
``` 

### 7. Change autoscaling parameters

We can also change the configuration of the `FleetAutoscaler` of the running `Fleet`, and have the changes
applied live, without interruptions of service.

Run `kubectl edit fleetautoscaler simple-udp-autoscaler` and set the `bufferSize` field to `5`. 
]
Let's look at the list of game servers again. Run `watch kubectl get gs`
until you can see that are 5 ready server instances:

```
NAME                     STATE     ADDRESS        PORT    NODE         AGE
simple-udp-mzhrl-7jpkp   Ready     10.30.64.100   7019    minikube     5m
simple-udp-mzhrl-czt8v   Ready     10.30.64.168   7556    minikube     5m
simple-udp-mzhrl-k6jg5   Ready     10.30.64.100   7243    minikube     5m
simple-udp-mzhrl-nb8h2   Ready     10.30.64.168   7357    minikube     5m
simple-udp-mzhrl-qspb6   Ready     10.30.64.99    7859    minikube     5m
simple-udp-mzhrl-zg9rq   Ready     10.30.64.99    7745    minikube     5m
```

## Next Steps

Read the advanced [Scheduling and Autoscaling]({{< relref "../Advanced/scheduling-and-autoscaling.md" >}}) guide, for more details on autoscaling. 

If you want to use your own GameServer container make sure you have properly integrated the [Agones SDK]({{< ref "/docs/Guides/Client SDKs/_index.md" >}}). 

