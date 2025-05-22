const Notification = require("../models/Notification");

const getNotificationsByReceiverId = async (req, res) => {
  const { receiverId } = req.params;

  try {
    const notifications = await Notification.find({
        receiverId,
        status: "sent", // ✅ Filter only sent notifications
      }).sort({ createdAt: -1 });

    res.status(200).json({
      status: true,
      message: "Notifications fetched successfully",
      data: notifications,
    });
  } catch (error) {
    console.error("Error fetching notifications:", error);
    res.status(500).json({
      status: false,
      message: "Failed to fetch notifications",
    });
  }
};

const deleteNotify = async (req,res) =>{
    try{
        let {id} = req.params
        const notify = await Notification.findByIdAndDelete({_id:id})
        if(notify){
            res.status(200).json({
                status: true,
                message: "Notifications deleted successfully",
               
              });
        }else{
            res.status(200).json({
                status: true,
                message: "notification not found",
               
              });
        }
    }catch(err){
      console.log(err)
    }
    
}

module.exports = {
  getNotificationsByReceiverId,
  deleteNotify
};
