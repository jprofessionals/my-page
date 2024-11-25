import React from "react";
import MonthOverviewModal from "./MonthOverviewModal";
import MonthOverviewButton from "@/components/hyttebooking/month-overview/components/MonthOverviewButton";

type Props = {
    admin: boolean;
    open: boolean;
    onOpenConfirm: () => void;
    onConfirmDelete: () => void;
    onClose: () => void;
  }

const DeletePendingBooking = ({ admin, open, onOpenConfirm, onConfirmDelete, onClose}: Props) => (
    <>
        {admin && (
            <div>
                <MonthOverviewButton
                    onClick={onOpenConfirm}
                    variant={"red_not_available"}
                    title={"Slett"}
                />

                <MonthOverviewModal open={open} onClose={onClose} label="Delete Confirmation">
                    <div>
                        <p className="mb-3">
                            Er du sikker på at du vil slette den ønskede
                            reservasjonen?
                        </p>
                        <div className="flex justify-end">
                            <MonthOverviewButton
                                onClick={onConfirmDelete}
                                variant={"red"}
                                title={"Slett ønsket reservasjon"}
                            />
                            <MonthOverviewButton
                                onClick={onClose}
                                variant={"gray"}
                                title={"Avbryt"}
                            />
                        </div>
                    </div>
                </MonthOverviewModal>
            </div>
        )}
    </>
);

export default DeletePendingBooking;
