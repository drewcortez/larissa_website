import { useCallback } from 'react';
import Link from 'next/link';
import { signin, signOut } from 'next-auth/client';
import { useSession } from 'next-auth/client';
import { useDropzone } from 'react-dropzone';
import Backdrop from './Backdrop';
import { useEffect, useRef, useState } from 'react';
import styles from './MainNav.module.scss';
import Button from '../utils/Button';
import Dialog from '../UI/Dialog';
import { useClickOutside } from '../../hooks/useClickOutside';
import { validateEmail } from '../../util/frontValidation';
import { useRouter } from 'next/router';
import Loading from './Loading';

const loginIco = (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 16 16"
  >
    <path
      fillRule="evenodd"
      d="M6 3.5a.5.5 0 0 1 .5-.5h8a.5.5 0 0 1 .5.5v9a.5.5 0 0 1-.5.5h-8a.5.5 0 0 1-.5-.5v-2a.5.5 0 0 0-1 0v2A1.5 1.5 0 0 0 6.5 14h8a1.5 1.5 0 0 0 1.5-1.5v-9A1.5 1.5 0 0 0 14.5 2h-8A1.5 1.5 0 0 0 5 3.5v2a.5.5 0 0 0 1 0v-2z"
    />
    <path
      fillRule="evenodd"
      d="M11.854 8.354a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H1.5a.5.5 0 0 0 0 1h8.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3z"
    />
  </svg>
);

export default function MainNav() {
  const router = useRouter();
  const [session] = useSession();
  const [client, setClient] = useState({});
  const [projects, setProjects] = useState([]);
  const [activeProj, setActiveProj] = useState({});
  const [loading, setLoading] = useState(false);
  const [openRepo, setOpenRepo] = useState(false);
  const [checkLogin, setCheckLogin] = useState(false);

  // web menus
  const menuItemOne = useRef();
  const menuItemTwo = useRef();
  const menuItemThree = useRef();

  // mobile menus
  const [mobileToggle, setMobileToggle] = useState(false);
  const [menuHover, setMenuHover] = useState(false);
  const [menuWidth, setMenuWidth] = useState(0);
  const [menuLeft, setMenuLeft] = useState(0);

  // log box
  const logBox = useRef();
  const [logToggle, setLogToggle] = useState(false);
  const [email, setEmail] = useState('');
  const [emailValid, setEmailValid] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordValid, setPasswordValid] = useState(true);
  useClickOutside(logBox, () => setLogToggle(false));

  // dialog
  const [show, setShowDialog] = useState(false);
  const [onOk, setOnOk] = useState(null);
  const [onCancel, setOnCancel] = useState(null);
  const [message, setMessage] = useState('');

  function mouseHoverList() {
    setMenuHover((state) => !state);
  }

  function mouseHoverItem(ref) {
    setMenuWidth(ref.current.offsetWidth);
    setMenuLeft(ref.current.offsetLeft);
  }

  function mobilenav_toggle() {
    setMobileToggle((t) => !t);
  }

  const validate = () => {
    let valid = true;
    setEmailValid(true);
    setPasswordValid(true);

    // email
    if (!validateEmail(email)) {
      setEmailValid(false);
      valid = false;
    }

    // password
    if (password.length <= 0) {
      setPasswordValid(false);
      valid = false;
    }

    return valid;
  };

  async function login(event) {
    event.preventDefault();
    setLoading(true);
    if (validate()) {
      const response = await signin('credentials', {
        redirect: false,
        email: email,
        password: password,
      });
      switch (response.status) {
        case 200:
          if (response.error) {
            setMessage(
              'Ops, algo deu errado. Por favor, tente daqui a pouquinho!'
            );
            setShowDialog(true);
          } else {
            setCheckLogin(true);
          }
          break;
        default:
          setMessage(
            'Ops, algo deu errado. Por favor, tente daqui a pouquinho!'
          );
          setShowDialog(true);
          break;
      }
    }
    setLoading(false);
  }

  async function logout(event) {
    event.preventDefault();
    signOut();
  }

  const openDrawer = async (perm) => {
    setLoading(true);
    if (session) {
      let p = perm || client.permission;
      if (!p) {
        let cli = await getUserProject();
        p = cli.permission;
      }
      if (p === 'adm') {
        router.push({ pathname: '/acesso' });
      } else if (p === 'cli') {
        setOpenRepo((v) => !v);
      }
    } else {
      setEmailValid(true);
      setPasswordValid(true);
      setLogToggle((v) => !v);
    }
    setLoading(false);
  };

  const setActiveProject = (project) => {
    setActiveProj(project);
  };

  const getUserProject = async () => {
    const res = await fetch(`/api/project?email=${session.user.email}`);
    const data = await res.json();
    setClient(data.client);
    setProjects(data.projects);
    setActiveProj(data.projects[0]);
    return data.client;
  };

  useEffect(() => {
    if (checkLogin && session) {
      setCheckLogin(false);
      getUserProject().then((client) => {
        setLogToggle(false);
        openDrawer(client.permission);
      });
    }
  });

  // file upload
  const [files, setFiles] = useState([]);
  const onDrop = useCallback((acceptedFiles) => {
    setFiles(acceptedFiles);
  }, []);
  const { getRootProps, getInputProps, isDragActive } = useDropzone({ onDrop });

  const cancelFiles = () => {
    setFiles([]);
  };

  const sendFiles = async () => {
    if (files.length === 0) {
      setMessage('Nenhum arquivo selecionado.');
      setOnCancel(null);
      setOnOk(() => () => setShowDialog(false));
      setShowDialog(true);
      return;
    }
    setLoading(true);
    const formData = new FormData();
    let method = 'POST';

    formData.append(
      'project',
      JSON.stringify({ projId: activeProj._id, cliEmail: client.email })
    );
    files.forEach((file) => {
      formData.append(file.name, file);
    });

    const data = await fetch('/api/files', {
      method: method,
      body: formData,
    });
    switch (data.status) {
      case 201:
        const savedProject = await data.json();
        setActiveProj(savedProject.project);
        setFiles([]);
        break;
      default:
        setMessage('Ops, algo deu errado. Por favor, tente daqui a pouquinho!');
        setOnOk(() => () => setShowDialog(false));
        setShowDialog(true);
        break;
    }
    setLoading(false);
  };

  const deleteFile = async (fileId, name) => {
    setLoading(true);
    const formData = new FormData();
    let method = 'PUT';

    formData.append(
      'project',
      JSON.stringify({
        projId: activeProj._id,
        cliEmail: client.email,
        file: { _id: fileId, name },
      })
    );

    const data = await fetch('/api/files', {
      method: method,
      body: formData,
    });
    switch (data.status) {
      case 201:
        const savedProject = await data.json();
        setActiveProj(savedProject.project);
        break;
      default:
        setMessage('Ops, algo deu errado. Por favor, tente daqui a pouquinho!');
        setOnOk(() => () => setShowDialog(false));
        setShowDialog(true);
        break;
    }
    setLoading(false);
  };

  function recoverPass() {
    setMessage(
      'Esqueceu sua senha? Iremos lhe enviar um email para recuperação de senha.'
    );
    setOnOk(() => () => recover());
    setOnCancel(() => () => setShowDialog(false));
    setShowDialog(true);
  }

  async function recover() {
    setOnOk(null);
    setOnCancel(null);
    setMessage(null);
    const local = await fetch('https://geolocation-db.com/json/');
    const location = await local.json();
    const response = await fetch('/api/recover', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, log: location }),
    });
    switch (response.status) {
      case 201:
        setMessage(
          'O email foi enviado. Por favor, cheque sua caixa de mensagens.'
        );
        break;
      case 404:
        setMessage(
          'Este email não está cadastrado. Por favor, tente outro endereço ou entre em contato conosco.'
        );
        break;
      default:
        setMessage(
          'Ops, estamos com um probleminha. Por favor, tente mais tarde.'
        );
        break;
    }
    setOnOk(() => () => setShowDialog(false));
  }

  return (
    <nav className={styles.container}>
      <div className={styles.content}>
        <div className={styles.mobilenav_icontoggle} onClick={mobilenav_toggle}>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="32"
            height="32"
            className={styles.mobilenav__icon}
            viewBox="0 0 16 16"
          >
            <path
              fillRule="evenodd"
              d="M2.5 12a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5zm0-4a.5.5 0 0 1 .5-.5h10a.5.5 0 0 1 0 1H3a.5.5 0 0 1-.5-.5z"
            />
          </svg>
        </div>
        <div
          className={[
            styles.mobilenav__menu,
            mobileToggle ? styles.mobileOn : '',
          ]
            .join(' ')
            .trim()}
        >
          <ul>
            <li>
              <Link href={{ pathname: '/' }} passHref>
                <a>home</a>
              </Link>
            </li>
            <li>
              <Link href={{ pathname: '/galeria' }} passHref>
                <a>Galeria</a>
              </Link>
            </li>
            <li>
              <Link href={{ pathname: '/contato' }} passHref>
                <a>Contato</a>
              </Link>
            </li>
          </ul>
        </div>
        <ul
          className={styles.webmenu}
          onMouseEnter={mouseHoverList}
          onMouseLeave={mouseHoverList}
        >
          <li
            ref={menuItemOne}
            onMouseEnter={mouseHoverItem.bind(this, menuItemOne)}
          >
            <Link href={{ pathname: '/' }} passHref>
              <a>home</a>
            </Link>
          </li>
          <li
            ref={menuItemTwo}
            onMouseEnter={mouseHoverItem.bind(this, menuItemTwo)}
          >
            <Link href={{ pathname: '/galeria' }} passHref>
              <a>Galeria</a>
            </Link>
          </li>
          <span
            className={styles.underline}
            style={{
              opacity: menuHover ? 1 : 0,
              width: menuWidth,
              left: menuLeft,
            }}
          />
          <li
            ref={menuItemThree}
            onMouseEnter={mouseHoverItem.bind(this, menuItemThree)}
          >
            <Link href={{ pathname: '/contato' }} passHref>
              <a>Contato</a>
            </Link>
          </li>
        </ul>
        <div className={styles.logbtn} onClick={() => openDrawer(null)}>
          {session ? 'Repositório' : 'Login'}
        </div>
        {mobileToggle && <Backdrop onDismiss={mobilenav_toggle} />}
        {logToggle && (
          <div className={styles.logBox} ref={logBox}>
            <form onSubmit={login}>
              <input
                type="email"
                id="email"
                placeholder="email"
                onChange={(e) => setEmail(e.target.value)}
                className={emailValid ? '' : styles.invalid}
              />
              <input
                type="password"
                id="password"
                placeholder="senha"
                onChange={(e) => setPassword(e.target.value)}
                className={passwordValid ? '' : styles.invalid}
              />
              {loading ? (
                <>
                  <p>esqueci minha senha</p>
                  <div className={styles.btnStatic}>Carregando...</div>
                </>
              ) : (
                <>
                  <p onClick={recoverPass}>esqueci minha senha</p>
                  <Button
                    style="primary"
                    icon={loginIco}
                    className={styles.enter}
                  >
                    Entrar
                  </Button>
                </>
              )}
            </form>
          </div>
        )}
        <div
          className={[styles.repoBox, openRepo ? styles.repoOn : ''].join(' ')}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            fill="currentColor"
            className={styles.leftIcon}
            viewBox="0 0 16 16"
            onClick={() => openDrawer(null)}
          >
            <path d="M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0zM4.5 7.5a.5.5 0 0 0 0 1h5.793l-2.147 2.146a.5.5 0 0 0 .708.708l3-3a.5.5 0 0 0 0-.708l-3-3a.5.5 0 1 0-.708.708L10.293 7.5H4.5z" />
          </svg>
          {openRepo && (
            <>
              <div className={styles.projectTabs}>
                {projects.map((project, index) => (
                  <div
                    key={project._id}
                    onClick={() => setActiveProject(project)}
                    className={
                      project._id === activeProj?._id ? styles.activeTab : ''
                    }
                  >
                    {index + 1}
                  </div>
                ))}
                <div key="space"></div>
              </div>
              <form>
                <p>Projeto: {activeProj?.name}</p>
                <p>arquivos:</p>
                <div className={styles.filesBox}>
                  {activeProj?.files.length > 0 ? (
                    activeProj?.files.map((file) => (
                      <div key={file.name}>
                        <Link href={file.uri}>
                          <a rel="noreferrer noopener" target={'_blank'}>
                            {file.name}
                          </a>
                        </Link>
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          width="16"
                          height="16"
                          fill="currentColor"
                          viewBox="0 0 16 16"
                          onClick={() => deleteFile(file._id, file.name)}
                        >
                          <path d="M2.5 1a1 1 0 0 0-1 1v1a1 1 0 0 0 1 1H3v9a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2V4h.5a1 1 0 0 0 1-1V2a1 1 0 0 0-1-1H10a1 1 0 0 0-1-1H7a1 1 0 0 0-1 1H2.5zm3 4a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 .5-.5zM8 5a.5.5 0 0 1 .5.5v7a.5.5 0 0 1-1 0v-7A.5.5 0 0 1 8 5zm3 .5v7a.5.5 0 0 1-1 0v-7a.5.5 0 0 1 1 0z" />
                        </svg>
                      </div>
                    ))
                  ) : (
                    <div className={styles.empty}>Vazio</div>
                  )}
                </div>
                <p>adicionar arquivos:</p>
                <div {...getRootProps({ className: styles.dropzone })}>
                  <input {...getInputProps()} multiple />
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="24"
                    height="24"
                    fill="currentColor"
                    viewBox="0 0 16 16"
                  >
                    <path d="M8.5 11.5a.5.5 0 0 1-1 0V7.707L6.354 8.854a.5.5 0 1 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 7.707V11.5z" />
                    <path d="M14 14V4.5L9.5 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2zM9.5 3A1.5 1.5 0 0 0 11 4.5h2V14a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1h5.5v2z" />
                  </svg>
                  {isDragActive ? (
                    <p>Solte os arquivos aqui ...</p>
                  ) : (
                    <p>
                      Arraste os arquivos para cá, ou clique para selecioná-los
                    </p>
                  )}
                </div>
                <div className={[styles.filesBox, styles.filesBox2].join(' ')}>
                  <ul>
                    {files?.map((file) => (
                      <li key={file.name}>{file.name}</li>
                    ))}
                  </ul>
                </div>
                <span className={styles.between}>
                  <span onClick={cancelFiles}>
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      className={styles.fileIcon}
                      viewBox="0 0 16 16"
                    >
                      <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0zM9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1zM6.854 7.146 8 8.293l1.146-1.147a.5.5 0 1 1 .708.708L8.707 9l1.147 1.146a.5.5 0 0 1-.708.708L8 9.707l-1.146 1.147a.5.5 0 0 1-.708-.708L7.293 9 6.146 7.854a.5.5 0 1 1 .708-.708z" />
                    </svg>
                    Cancelar
                  </span>
                  <span onClick={sendFiles}>
                    Enviar
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      width="24"
                      height="24"
                      fill="currentColor"
                      className={styles.fileIcon}
                      viewBox="0 0 16 16"
                    >
                      <path d="M9.293 0H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2V4.707A1 1 0 0 0 13.707 4L10 .293A1 1 0 0 0 9.293 0zM9.5 3.5v-2l3 3h-2a1 1 0 0 1-1-1zM6.354 9.854a.5.5 0 0 1-.708-.708l2-2a.5.5 0 0 1 .708 0l2 2a.5.5 0 0 1-.708.708L8.5 8.707V12.5a.5.5 0 0 1-1 0V8.707L6.354 9.854z" />
                    </svg>
                  </span>
                </span>
              </form>
            </>
          )}
          <p className={styles.logout} onClick={logout}>
            sair
          </p>
        </div>
      </div>
      <Dialog show={show} onOk={onOk} onCancel={onCancel}>
        {message}
      </Dialog>
      <Loading show={loading} />
    </nav>
  );
}
