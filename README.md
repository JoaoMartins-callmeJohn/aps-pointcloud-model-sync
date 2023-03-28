#POTREE-MODEL-SYNC

THIS IS A WORK IN PROGRESS

This is a sample to sync a model from one scene with a point cloud through points of reference, using Transformation matrices obtained through defined space basis.

This method is the same one applied on blog [synchronizing camera between models](https://aps.autodesk.com/blog/synchronizing-camera-between-models).

In this sample, we're using a custom [raycaster](https://threejs.org/docs/#api/en/core/Raycaster) from pure THREE js in order to find the proper points according to the camera configurations and ray direction.

The approach for the point selection is:

- Go through the tiles recursivelly
- Check if the raycast has intersection with each tile's [box](https://threejs.org/docs/?q=box3#api/en/math/Box3) 
- If so, we find the intersection points according to the defined treshold
- Then, we pick the closest point to the ray.

It lacks fine-tuning on the algorithm for better precision, as you can see from pickin the points below:

![pick points](./images/precision_raycaster.gif)

With all points defined in the pointcloud, we can focus on finding the correlated points in the model:

![all points defined](./images/all_points_defined.gif)

And with that, we have the synchronized models based on the obtained points:

![sync](./images/sync_unprecise.gif)
