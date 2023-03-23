#POTREE-MODEL-SYNC

THIS IS A WORK IN PROGRESS

This is a sample to sync a model from one scene with a point cloud through points of reference, using Transformation matrices obtained through defined space basis.

This method is the same one applied on blog [synchronizing camera between models](https://aps.autodesk.com/blog/synchronizing-camera-between-models).

As of now, it's using Viewer's hitTest function to obtain the point from the points loaded. We're basically retrieving the closest point to the ray.

It lacks fine-tuning on the algorithm for better precision, as you can see from pickin the points below:

![pick points](./images/precision_hittest.gif)

With all points defined in the pointcloud, we can focus on finding the sorrelated points in the model:

![all points defined](./images/all_points_defined.gif)

And with that, we have the synchronized models based on the obtained points:

![sync](./images/sync_unprecise.gif)

GLB stone lion from https://sketchfab.com/3d-models/stone-lion-bf38a87d03834065a5f25c29a1cd7273
