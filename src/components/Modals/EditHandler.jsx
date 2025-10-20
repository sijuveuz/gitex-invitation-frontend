// components/Modals/EditHandler.jsx
import React, { useState, useEffect } from "react";
import axios from "axios";
import BulkPersonalLinkEditModal from "./BulkPersonalLinkEditModal";
import LinkEditModal from "./GeneratedLinkEditModal";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

const MySwal = withReactContent(Swal);
const API_URL = process.env.REACT_APP_API_URL;
const EditHandler = ({ show, id, onClose, onSuccess }) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  // fetch details to decide modal type
  useEffect(() => {
    if (!show || !id) return;

    const fetchDetails = async () => {
      setLoading(true);
      try {
        const token = localStorage.getItem("token");
        const res = await axios.get(
          `${API_URL}/api/invitations/dash/${id}/`,
          { headers: { Authorization: token ? `Bearer ${token}` : "" } }
        );
        setData(res.data.data);
      } catch (err) {
        console.error(err);
        MySwal.fire("Error", "Failed to load invitation details", "error");
        onClose();
      } finally {
        setLoading(false);
      }
    };

    fetchDetails();
  }, [show, id]);

  if (!show) return null;
  if (loading)
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center text-white">
        Loading details...
      </div>
    );

  if (!data) return null;

  // decide modal type
  const type = data.source_type;
  if (type === "link") {
    return (
      <LinkEditModal
        show={show}
        id={id}
        onClose={onClose}
        onSuccess={onSuccess}
      />
    );
  }

  // for personal/bulk
  return (
    <BulkPersonalLinkEditModal
      show={show}
      id={id}
      onClose={onClose}
      onSuccess={onSuccess}
    />
  );
};

export default EditHandler;
