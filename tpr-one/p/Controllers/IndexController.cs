using System;
using System.Collections.Generic;
using System.Configuration;
using System.IO;
using System.Linq;
using System.Web;
using System.Web.Mvc;
using System.Web.Script.Serialization;

namespace p.Controllers
{
    public class IndexController : Controller
    {
        // GET: Index
        public ActionResult Index()
        {
            return View();
        }

        [HttpPost]
        public JsonResult Upload(dynamic scene)
        {
            if (scene != null)
            {
                if (scene.ContentLength > 0)
                {
                    // get contents to string
                    string str = (new StreamReader(scene.InputStream)).ReadToEnd();

                    // deserializes string into object
                    //JavaScriptSerializer jss = new JavaScriptSerializer();
                    //var d = jss.Deserialize<dynamic>(str);

                    // once it's an object, you can use do with it whatever you want
                    return Json(str);
                }
            }
            return null;
        }

        [HttpPost]
        public FileResult Save(string file)
        {
            return File(file, "text", "");
        }
    }
}