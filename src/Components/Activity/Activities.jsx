import React, { useEffect, useState, useCallback } from "react";
import Head from "../Helper/Head";
import { FaClipboardList, FaEdit, FaWindowClose } from "react-icons/fa";
import { Link } from "react-router-dom";
import { Confirm } from "react-st-modal";
import styles from "./Activities.module.css";
import stylesBtn from "../Forms/Button.module.css";
import { ACTIVITY_GET, ACTIVITY_DELETE } from "../../API/Api_Activity";
import axios from "axios";

import DataTable from "react-data-table-component";
import Filter from "../Tables/Filter";
import {formata_data_hora, status_atividade} from "../Helper/Functions";

const Activities = () => {
  const [activities, setActivities] = useState([]);

  useEffect(() => {
    async function getData() {
      const { url, options } = ACTIVITY_GET();
      const response = await axios.get(url, options);
      let atividades = response.data;

      for (let i = 0; i < atividades.length; i++){
        atividades[i].status_description = status_atividade(atividades[i].status_id);
        atividades[i].start = formata_data_hora(atividades[i].start);
        atividades[i].end = formata_data_hora(atividades[i].end);
      }

      setActivities(atividades);
    }

    getData();
  }, []);

  async function modalConfirm(ActivityId, ActivityName) {
    const result = await Confirm(
      "Inativar a atividade " + ActivityName + "?",
      "Inativação de atividade"
    );
    if (result) {
      const { url, options } = ACTIVITY_DELETE(ActivityId);
      await axios.delete(url, options);
      window.location.reload(false);
    }
  }

  const [filterText, setFilterText] = useState('');
  const [resetPaginationToggle, setResetPaginationToggle] = useState(false);
  const filteredItems = activities.filter(item => (
      (item.name && item.name.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.start && item.start.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.end && item.end.toLowerCase().includes(filterText.toLowerCase())) ||
      (item.status_description && item.status_description.toLowerCase().includes(filterText.toLowerCase()))
  ));

  const subHeaderComponentMemo = React.useMemo(() => {
    const handleClear = () => {
      if (filterText) {
        setResetPaginationToggle(!resetPaginationToggle);
        setFilterText('');
      }
    };

    return <Filter onFilter={e => setFilterText(e.target.value)} onClear={handleClear} filterText={filterText} />;
  }, [filterText, resetPaginationToggle]);

  const columns = [
    {name:"Nome", selector:'name', sortable:true},
    {name:"Início", selector:'start', sortable:true},
    {name:"Fim", selector:'end', sortable:true},
    {name:"Status", selector:'status_description', sortable:true}
  ];

  const createColumns = useCallback(() => {
    return [
      ...columns,
      {
        name: '',
        allowOverflow: true,
        maxWidth: '50px',
        cell: row => {
          return (
              <>
                <Link to={`participants?activity=${row.id}&name=${row.name}`} >
                  <FaClipboardList className="mx-5" size={16} style={{ color: "green" }} title="Participantes" />
                </Link>
                <Link to={`edit/${row.id}`}>
                  <FaEdit size={16} style={{ color: "blue" }} title="Editar" />
                </Link>
                <button onClick={() => { modalConfirm(row.id, row.name); }} className="cursor-pointer" title="Remover" >
                  <FaWindowClose size={16} style={{ color: "red" }} />
                </button>
              </>
          );
        },
      },
    ];
  }, [columns]);

  return (
    <section className="animeLeft">
      <Head title="Atividades" />
      <h1 className="title title-2">Atividades</h1>
      <Link className={stylesBtn.button} to="createactivity">
        Cadastrar
      </Link>
      <div className={styles.activities}>
        <DataTable
            title="Atividades cadastradas"
            columns={createColumns()}
            data={filteredItems}
            pagination
            subHeader
            subHeaderComponent={subHeaderComponentMemo}
            persistTableHead
        />
      </div>
    </section>
  );
};

export default Activities;
