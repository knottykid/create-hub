const router = require("express").Router();
const Community = require("../models/Community.model");
const User = require("../models/User.model");
const Discussion = require("../models/Discussion.model");
const isLoggedIn = require("../middlewares/isLoggedIn");
const apiURL = `http://api.mediastack.com/v1/news?access_key=${process.env.NEWS_API_KEY}`;
const axios = require("axios");
const parser = require("../config/cloudinary");
//let apidata;

router.get("/", (req, res) => {
  res.render("community/community-home", { user: req.session.user?._id });
});

// JOIN A COMMUNITY SPACE
router.get("/:dynamicCommunity/join", isLoggedIn, async (req, res) => {
  const member = await Community.find({ members: req.session.user._id });
  const singleCommunity = await Community.findOneAndUpdate(
    {
      slug: req.params.dynamicCommunity,
    },
    { $addToSet: { members: req.session.user._id } }
  ).populate("members");

  await User.findByIdAndUpdate(req.session.user._id, {
    $addToSet: { interests: singleCommunity._id },
  });
  res.render("community/community-joined", {
    members: member,
    activeSlug: req.params.dynamicCommunity,
    user: req.session.user._id,
  });
});

// MAKING COMMENTS - not yet working
// router.post(
//   "/:dynamicCommunity/discussion/:dynamicDiscussion/comment",
//   isLoggedIn,
//   (req, res) => {
//     Community.findOne({ slug: req.params.dynamicCommunity })
//       .populate("discussionTopics")
//       .then((singleCommunity) => {
//         Discussion.findById(req.params.dynamicDiscussion).then(
//           (singleDiscussion) => {
//             const { title, text } = req.body;
//             Comment.create({
//               title,
//               text,
//               createdBy: req.session.user._id,
//             }).then((newComment) => {
//               console.log(newComment);
//               res.redirect(`/community/${singleCommunity.slug}`);
//             });
//           }
//         );
//       });
//   }
// );

// LOADS EACH COMMUNITY HOME DYNAMICALLY
// Each community can be viewed by anybody not signed in
router.get("/:dynamicCommunity", (req, res) => {
  Community.findOne({ slug: req.params.dynamicCommunity })
    .populate("discussionTopics")
    .then((singleCommunity) => {
      if (!singleCommunity) {
        return res.redirect("/");
      }
      let keyword = singleCommunity.keyword;
      let discussions = singleCommunity.discussionTopics;
      getNewsStories(keyword).then((apidata) => {
        res.render("community/single-community", {
          singleCommunity: singleCommunity,
          apidata: apidata,
          user: req.session.user?._id,
          discussions: discussions,
        });
      });
    });
});

function getNewsStories(keyword) {
  return axios
    .get(`${apiURL}&keywords=${keyword}&languages=en`)
    .then((response) => {
      // console.log(response.data.data[0]);
      return response.data.data;
    });
}

module.exports = router;
