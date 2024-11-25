import React from "react";
import CreateInfoNotice from "@/components/hyttebooking/CreateInfoNotice";
import MonthOverviewModal from "@/components/hyttebooking/month-overview/components/MonthOverviewModal";
import EditInfoNotice from "@/components/hyttebooking/EditInfoNotice";
import {InfoBooking} from "@/types";
import MonthOverviewButton from "@/components/hyttebooking/month-overview/components/MonthOverviewButton";

type Props = {
    infoNoticeIndex: number;
    infoNotice: InfoBooking;
    admin: boolean;
    isDayVacantForInfoNotice: boolean;
    showEditFormForInfoNotice?: number;
    onCloseModal: () => void;
    onRefreshNoticeVacancies: () => void;
    infoNoticeDeleteModalIsOpen: boolean;
    onAddInfoNoticeClick: () => void;
    showCreateFormForInfoNotice: boolean;
    infoNoticeVacancies?: string[];
    date?: Date;
    onEditInfoNotice: (infoNoticeId: number) => void;
    onInfoNoticeDeleteModal: (infoNotice: number | null) => void;
    onConfirmInfoNoticeDelete: () => void;
    onCloseInfoNoticeDeleteModal: () => void;
 }

const InfoNoticeItem = ({ infoNoticeIndex, infoNotice, admin,isDayVacantForInfoNotice, showEditFormForInfoNotice, onCloseModal, infoNoticeDeleteModalIsOpen, onRefreshNoticeVacancies, showCreateFormForInfoNotice, infoNoticeVacancies, onAddInfoNoticeClick, date, onEditInfoNotice, onInfoNoticeDeleteModal, onConfirmInfoNoticeDelete, onCloseInfoNoticeDeleteModal }: Props) => (
    <div key={infoNoticeIndex} className="mt-1 mb-1 pl-2 border-l-2 border-blue-500">
        <span className="information-text ">{infoNotice.description}</span>

        {admin && (
            <>
                {isDayVacantForInfoNotice && (
                    <>
                        <MonthOverviewButton
                            onClick={() => onAddInfoNoticeClick()}
                            variant={"blue"}
                            title={"Legg til"}
                        />

                        {showCreateFormForInfoNotice && (
                            <CreateInfoNotice
                                date={date}
                                closeModal={onCloseModal}
                                userIsAdmin={admin}
                                infoNoticeVacancies={infoNoticeVacancies}
                                refreshInfoNoticeVacancies={onRefreshNoticeVacancies}
                            />
                        )}
                    </>
                )}

                <MonthOverviewButton
                    onClick={() => onEditInfoNotice(infoNotice.id)}
                    variant={"yellow"}
                    title={"Rediger"}
                />

                <MonthOverviewButton
                    onClick={() => onInfoNoticeDeleteModal(infoNotice.id)}
                    variant={"red"}
                    title={"Slett"}
                />
            </>
        )}

        <MonthOverviewModal open={infoNoticeDeleteModalIsOpen} onClose={onCloseModal} label="Delete Confirmation">
            <div>
                <p className="mb-3">
                    Er du sikker på at du vil slette notisen?
                </p>

                <div className="flex justify-end">
                    <MonthOverviewButton
                        onClick={onConfirmInfoNoticeDelete}
                        variant={"red"}
                        title={"Slett notis"}
                    />

                    <MonthOverviewButton
                        onClick={onCloseInfoNoticeDeleteModal}
                        variant={"gray"}
                        title={"Avbryt"}
                    />
                </div>
            </div>
        </MonthOverviewModal>

        {showEditFormForInfoNotice === infoNotice.id && (
            <EditInfoNotice
                infoNotice={infoNotice}
                closeModal={onCloseModal}
                userIsAdmin={admin}
                refreshInfoNoticeVacancies={onRefreshNoticeVacancies}
            />
        )}
    </div>
);

export default InfoNoticeItem;
