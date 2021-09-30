import PropTypes from 'prop-types';
import styles from './Project.module.scss';

const Project = ({ project }) => {
  if (project) {
    return (
      <div className={styles.content}>
        <section className={styles.header}>
          <table>
            <tbody>
              <tr>
                <td>Projeto:</td>
                <td>{project.projName}</td>
                <td>Criado Em:</td>
                <td>{new Date(project.createdOn).toLocaleDateString()}</td>
              </tr>
              <tr>
                <td>Cliente:</td>
                <td>{`${project.clFirstName} ${project.clLastName}`}</td>
                <td>CPF/CNPJ:</td>
                <td>{project.cpf_cnpj}</td>
              </tr>
              <tr>
                <td>Telefone:</td>
                <td>{project.phone}</td>
                <td>Email:</td>
                <td>{project.email}</td>
              </tr>
              <tr>
                <td>Endereço:</td>
                <td colspan={3}>{`${project.address1}, ${project.address2}, ${project.city} - ${project.state}`}</td>
              </tr>
            </tbody>
          </table>
        </section>
        <section className={styles.files}>Arquivos</section>
      </div>
    );
  }

  return (
    <div className={styles.empty}>
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="80"
        height="80"
        fill="currentColor"
        viewBox="0 0 16 16"
      >
        <path
          fillRule="evenodd"
          d="M14.763.075A.5.5 0 0 1 15 .5v15a.5.5 0 0 1-.5.5h-3a.5.5 0 0 1-.5-.5V14h-1v1.5a.5.5 0 0 1-.5.5h-9a.5.5 0 0 1-.5-.5V10a.5.5 0 0 1 .342-.474L6 7.64V4.5a.5.5 0 0 1 .276-.447l8-4a.5.5 0 0 1 .487.022zM6 8.694 1 10.36V15h5V8.694zM7 15h2v-1.5a.5.5 0 0 1 .5-.5h2a.5.5 0 0 1 .5.5V15h2V1.309l-7 3.5V15z"
        />
        <path d="M2 11h1v1H2v-1zm2 0h1v1H4v-1zm-2 2h1v1H2v-1zm2 0h1v1H4v-1zm4-4h1v1H8V9zm2 0h1v1h-1V9zm-2 2h1v1H8v-1zm2 0h1v1h-1v-1zm2-2h1v1h-1V9zm0 2h1v1h-1v-1zM8 7h1v1H8V7zm2 0h1v1h-1V7zm2 0h1v1h-1V7zM8 5h1v1H8V5zm2 0h1v1h-1V5zm2 0h1v1h-1V5zm0-2h1v1h-1V3z" />
      </svg>
      PROJETO
    </div>
  );
};

Project.propTypes = {
  project: PropTypes.shape({
    _id: PropTypes.string,
    projName: PropTypes.string,
    clFirstName: PropTypes.string,
    clLastName: PropTypes.string,
    email: PropTypes.string,
    cpf_cnpj: PropTypes.string,
    phone: PropTypes.string,
    address1: PropTypes.string,
    address2: PropTypes.string,
    city: PropTypes.string,
    state: PropTypes.string,
    createdOn: PropTypes.oneOfType([PropTypes.object, PropTypes.string]),
  }),
  onDismiss: PropTypes.func,
};

export default Project;