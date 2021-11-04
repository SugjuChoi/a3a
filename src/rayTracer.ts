// classes you may find useful.  Feel free to change them if you don't like the way
// they are set up.


export class Vector {
    constructor(public x: number,
                public y: number,
                public z: number) {
    }
    static times(k: number, v: Vector) { return new Vector(k * v.x, k * v.y, k * v.z); }
    static minus(v1: Vector, v2: Vector) { return new Vector(v1.x - v2.x, v1.y - v2.y, v1.z - v2.z); }
    static plus(v1: Vector, v2: Vector) { return new Vector(v1.x + v2.x, v1.y + v2.y, v1.z + v2.z); }
    static dot(v1: Vector, v2: Vector) { return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z; }
    static mag(v: Vector) { return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z); }
    static norm(v: Vector) {
        var mag = Vector.mag(v);
        var div = (mag === 0) ? Infinity : 1.0 / mag;
        return Vector.times(div, v);
    }
    static cross(v1: Vector, v2: Vector) {
        return new Vector(v1.y * v2.z - v1.z * v2.y,
                          v1.z * v2.x - v1.x * v2.z,
                          v1.x * v2.y - v1.y * v2.x);
    }

    static distance(v1: Vector, v2: Vector) {
        return Math.sqrt( Math.pow(v1.x - v2.x, 2) + Math.pow(v1.y - v2.y, 2) + Math.pow(v1.z - v2.z, 2));
    }
}

export class Color {
    constructor(public r: number,
                public g: number,
                public b: number) {
    }
    static scale(k: number, v: Color) { return new Color(k * v.r, k * v.g, k * v.b); }
    static plus(v1: Color, v2: Color) { return new Color(v1.r + v2.r, v1.g + v2.g, v1.b + v2.b); }
    static times(v1: Color, v2: Color) { return new Color(v1.r * v2.r, v1.g * v2.g, v1.b * v2.b); }
    static white = new Color(1.0, 1.0, 1.0);
    static grey = new Color(0.5, 0.5, 0.5);
    static black = new Color(0.0, 0.0, 0.0);
    static toDrawingColor(c: Color) {
        var legalize = (d: number) => d > 1 ? 1 : d;
        return {
            r: Math.floor(legalize(c.r) * 255),
            g: Math.floor(legalize(c.g) * 255),
            b: Math.floor(legalize(c.b) * 255)
        }
    }
}

interface Ray {
    start: Vector;
    dir: Vector;
}

/*
spheres.push({Color: new Color(dr, dg, db), 
    Center: new Vector(x,y,z),
    Radius: radius, K_ambient: k_ambient, K_specular: k_specular,
    Specular_power: specular_pow});
*/

class Sphere {
    constructor(
        public color: Color,
        public center: Vector,
        public radius: number,
        public k_ambient: number,
        public k_specular: number,
        public specular_pow: number
    ) {

    }
    
}

/*
closest_point = {Point: p1, Shape: sphere};
*/

interface ClosestPoint {
    point: Vector;
    shape: Sphere;
}

class Light {
    constructor(
        public color: Color,
        public position: Vector
    ) {

    }

}



// variables
var spheres : Sphere[];
var lights : Light[];

var ambientLight;
var fov: number;
var background: Color;

var eyePosition: Vector;
//var orthoFrame: {U: Vector,V: Vector,W:Vector};
var U: Vector;
var V: Vector;
var W: Vector;

var forward: Vector;
var right: Vector;
var up: Vector;
 
var intersection = null;


// A class for our application state and functionality
class RayTracer {
    // the constructor paramater "canv" is automatically created 
    // as a property because the parameter is marked "public" in the 
    // constructor parameter
    // canv: HTMLCanvasElement
    //
    // rendering context for the canvas, also public
    // ctx: CanvasRenderingContext2D

    // initial color we'll use for the canvas
    canvasColor = "lightyellow"

    canv: HTMLCanvasElement
    ctx: CanvasRenderingContext2D 

    // div is the HTMLElement we'll add our canvas to
    // width, height are the size of the canvas
    // screenWidth, screenHeight are the number of pixels you want to ray trace
    //  (recommend that width and height are multiples of screenWidth and screenHeight)
    constructor (div: HTMLElement,
        public width: number, public height: number, 
        public screenWidth: number, public screenHeight: number) {

        // let's create a canvas and to draw in
        this.canv = document.createElement("canvas");
        this.ctx = this.canv.getContext("2d")!;
        if (!this.ctx) {
            console.warn("our drawing element does not have a 2d drawing context")
            return
        }
 
        div.appendChild(this.canv);

        this.canv.id = "main";
        this.canv.style.width = this.width.toString() + "px";
        this.canv.style.height = this.height.toString() + "px";
        this.canv.width  = this.width;
        this.canv.height = this.height;
    }

    
    // API Functions you should implement

    // clear out all scene contents
    reset_scene() {
        // initialize all the data structures and variables so you can start with an empty scene
        spheres = [];
        lights = [];
        fov = 0;
        ambientLight = new Color(0,0,0);
        background = new Color(0,0,0);
        eyePosition = new Vector(0,0,0);
        let U: Vector;
        let V: Vector;
        let W: Vector;
        U = new Vector(0,0,0);
        V = new Vector(0,0,0);
        W = new Vector(0,0,0);
        //orthoFrame = {U, V, W};
    }

    // create a new point light source
    new_light (r: number, g: number, b: number, x: number, y: number, z: number) {
        // create a point light scource at position (x, y, z) and its color (r, g, b).
        // your code should alloq at least 10 light sources.
        let vec: Vector;
        vec = new Vector(x,y,z);
        let col: Color;
        col = new Color(r,g,b);

        let light = new Light(col, vec);

        lights.push(light);
    }

    // set value of ambient light source
    ambient_light (r: number, g: number, b: number) {
        // create an "ambient" ligth with color (r,g,b) 
        // in order to approximate indirect illumination
        // there is only one ambient light; multiple calls will just replace the ambient light
        
        ambientLight = new Color(r,g,b);
    }

    // set the background color for the scene
    set_background (r: number, g: number, b: number) {
        background = new Color(r,g,b);
    }

    // set the field of view
    DEG2RAD = (Math.PI/180)
    set_fov (theta: number) {
        fov = theta*this.DEG2RAD;
        //distance d *tan(theta-->rad/2)) --> calculate the height (how wide & high the view height is)
        // d: 1 -
    }

    


    // set the virtual camera's position and orientation
    // x1,y1,z1 are the camera position
    // x2,y2,z2 are the lookat position
    // x3,y3,z3 are the up vector
    set_eye(x1: number, y1: number, z1: number, 
            x2: number, y2: number, z2: number, 
            x3: number, y3: number, z3: number) {

        let u = new Vector(x1, y1, z1);
        let v = new Vector(x2, y2, z2);
        let w = new Vector(x3, y3, z3);

        eyePosition = u;

       // orthoFrame = {U: Vector.norm(u), V: Vector.norm(v), W: Vector.norm(w)};
       U = Vector.norm(u);
       V = Vector.norm(v);
       W = Vector.norm(w);
                
        forward = Vector.minus(v,u);
        right = Vector.cross(forward,w);
        up = Vector.cross(forward, right);
       
    }

    // create a new sphere
    new_sphere (x: number, y: number, z: number, radius: number, 
                dr: number, dg: number, db: number, 
                k_ambient: number, k_specular: number, specular_pow: number) {
                    // specifies the creation of a spher with its center at (x,y,z) and with a given radius
                    // the diffuse color of the sphere is given by (dr, dg, db)
                    // the coefficient k_ambient specifies how much of the ambient light 
                    // combines with the diffuse color of the surface

                    // we will assume that all specular highlights are white,
                    // and the brightness of the highlight is given by k_specular
                    // the tightness of the hightlight is guided by specular_power

                   // var newSphere = new sphere;
                   // sphere_list.push(n)

                   spheres.push({color: new Color(dr, dg, db), 
                                center: new Vector(x,y,z),
                                radius: radius, k_ambient: k_ambient, k_specular: k_specular,
                                specular_pow: specular_pow});
    }

    // INTERNAL METHODS YOU MUST IMPLEMENT

    // create an eye ray based on the current pixel's position
    private eyeRay(i: number, j: number): Ray {

        //slide 14
        let uu = Vector.times((2*i - fov)/this.width, right); // could be up swap
        let vv = Vector.times((2*j - fov)/this.height - 1, up);
        let ww = Vector.times(1, forward);

        let uv = Vector.plus(uu, vv);
        let uvw = Vector.plus(uv, ww);

        let ray = {start: eyePosition, dir: uvw};

        return ray;
    }

    // finds the closest point on one of the spheres and calls some method to compute the color for it.
    private traceRay(ray: Ray, depth: number = 0): Color {
        // i know the start & dir or ray
        //shoot ray from start to dir

        // how do i shoot a ray
        // how do i detect obj?

        var closest_point: ClosestPoint;
        var dummyVec = new Vector(0,0,0);
        var dummySphere = new Sphere(new Color(0,0,0), dummyVec, 0,0,0,0);
        closest_point = {point: dummyVec, shape: dummySphere };

        var found_point: Boolean;

        found_point = false;

        let r = 0;
        let g = 0;
        let b = 0;


        // loop through all the obj
        for(let sphere of spheres) {
            
            closest_point = {point: ray.start, shape: sphere};

            let a = Math.pow(ray.dir.x, 2) + Math.pow(ray.dir.y, 2) + Math.pow(ray.dir.z, 2);
            let b = 2 * (((ray.start.x - sphere.center.x)*ray.dir.x) + ((ray.start.y - sphere.center.y)*ray.dir.y) + (ray.start.z - sphere.center.z) * ray.dir.z);
            let c = Math.pow((ray.start.x - sphere.center.x), 2) + Math.pow((ray.start.y - sphere.center.y), 2) + Math.pow((ray.start.z - sphere.center.z), 2);

            let r = Math.pow(b, 2) - (4*a*c);

            if (r >= 0) {
                let t_1 = ((-1 * b) + Math.sqrt(r)) / (2 * a);
                let t_2 = ((-1 * b) - Math.sqrt(r)) / (2 * a);
                let p_1 = new Vector(ray.start.x + (t_1 * ray.dir.x), ray.start.y + (t_1 * ray.dir.y), ray.start.z + (t_1 * ray.dir.z));
                let p_2 = new Vector(ray.start.x + (t_2 * ray.dir.x), ray.start.y + (t_2 * ray.dir.y), ray.start.z + (t_2 * ray.dir.z));

                //Question: how to check if closest_point is null??????
                    // can i do closest_point.point = ray.start?????
                if (found_point = false || Vector.distance(p_1, ray.start) < Vector.distance(closest_point.point, ray.start)) {
                    closest_point = {point: p_1, shape: sphere};
                    found_point = true;
                }
                  
                if (found_point = false || Vector.distance(p_2, ray.start) < Vector.distance(closest_point.point, ray.start)) {
                    closest_point = {point: p_2, shape: sphere};
                    found_point = true;
                }
            }
        }

        //if we did not find a closest point
        if ( found_point = false ) {
            r = background.r;
            g = background.g;
            b = background.b;
        } else {
            let n = new Vector(closest_point.point.x - closest_point.shape.center.x, closest_point.point.y - closest_point.shape.center.y, closest_point.point.z - closest_point.shape.center.z);
            n = Vector.norm(n);
            for (let light of lights) {

                let l = new Vector(light.position.x - closest_point.point.x, light.position.y - closest_point.point.y, light.position.z - closest_point.point.z);
                l = Vector.norm(l);
                let lightness = Math.max(0, Vector.dot(n, l));
                
                r += closest_point.shape.color.r * (light.color.r * lightness);
                g += closest_point.shape.color.g * (light.color.g * lightness);
                b += closest_point.shape.color.b * (light.color.b * lightness);
            }
        }


        let color = new Color(r,g,b);

        return color;
            // quatratic formula (slide 17 - lecture.14) a,b,c
            // t value: distance 

        // detect intersection point, loop through light, 
        // use shading equation

        //trace ray returns color (sphere's color), if not contact --> return background color.


    }

    // draw_scene is provided to create the image from the ray traced colors. 
    // 1. it renders 1 line at a time, and uses requestAnimationFrame(render) to schedule 
    //    the next line.  This causes the lines to be displayed as they are rendered.
    // 2. it uses the additional constructor parameters to allow it to render a  
    //    smaller # of pixels than the size of the canvas
    draw_scene() {

        // rather than doing a for loop for y, we're going to draw each line in
        // an animationRequestFrame callback, so we see them update 1 by 1
        var pixelWidth = this.width / this.screenWidth;
        var pixelHeight = this.height / this.screenHeight;
        var y = 0;
        
        this.clear_screen();

        var renderRow = () => {
            for (var x = 0; x < this.screenWidth; x++) {

                var ray = this.eyeRay(x, y);
                var c = this.traceRay(ray);

                var color = Color.toDrawingColor(c)
                this.ctx.fillStyle = "rgb(" + String(color.r) + ", " + String(color.g) + ", " + String(color.b) + ")";
                this.ctx.fillRect(x * pixelWidth, y * pixelHeight, pixelWidth+1, pixelHeight+1);
            }
            
            // finished the row, so increment row # and see if we are done
            y++;
            if (y < this.screenHeight) {
                // finished a line, do another
                requestAnimationFrame(renderRow);            
            } else {
                console.log("Finished rendering scene")
            }
        }

        renderRow();
    }

    clear_screen() {
        this.ctx.fillStyle = this.canvasColor;
        this.ctx.fillRect(0, 0, this.canv.width, this.canv.height);

    }
}
export {RayTracer}